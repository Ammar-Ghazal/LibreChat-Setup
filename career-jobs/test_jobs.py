import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import jobs

GH = {'source':'greenhouse','board':'testco','company':'Test Co'}
ITEM = {'id':1,'title':'Software Engineer','absolute_url':'https://example.com/jobs/1',
        'location':{'name':'Amsterdam'},'content':'<h2>Qualifications</h2><p>Python and SQL required.</p>',
        'updated_at':'2026-09-01T10:00:00Z'}

class JobsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.old = jobs.DB; jobs.DB = Path(self.tmp.name)/'jobs.db'
    def tearDown(self):
        jobs.DB = self.old; self.tmp.cleanup()
    def test_idempotent_sync_and_first_seen(self):
        row = jobs.normalize(GH,ITEM)
        self.assertEqual(jobs.save_snapshot(GH,[row])['new'],1)
        first = jobs.get_job_details(row['job_key'])['first_seen']
        self.assertEqual(jobs.save_snapshot(GH,[row])['new'],0)
        self.assertEqual(jobs.search_jobs()['total_matches'],1)
        self.assertEqual(jobs.get_job_details(row['job_key'])['first_seen'],first)
    def test_changes_and_missing_reappearance(self):
        row = jobs.normalize(GH,ITEM); jobs.save_snapshot(GH,[row])
        newer = jobs.normalize(GH,dict(ITEM,content='Rust required'))
        self.assertEqual(jobs.save_snapshot(GH,[newer])['changed'],1)
        jobs.save_snapshot(GH,[])
        self.assertEqual(jobs.search_jobs()['total_matches'],0)
        self.assertEqual(jobs.search_jobs(include_not_seen=True)['jobs'][0]['status'],'not_seen')
        jobs.save_snapshot(GH,[newer])
        self.assertEqual(jobs.search_jobs()['total_matches'],1)
    def test_failed_sync_preserves_existing(self):
        jobs.save_snapshot(GH,[jobs.normalize(GH,ITEM)])
        sources = Path(self.tmp.name)/'sources.json'; sources.write_text(json.dumps([GH]))
        with patch.object(jobs,'SOURCES',sources), patch.object(jobs,'fetch',side_effect=ValueError('bad response')):
            self.assertEqual(jobs.sync(),1)
        self.assertEqual(jobs.search_jobs()['total_matches'],1)
    def test_filters_and_no_date_invention(self):
        jobs.save_snapshot(GH,[jobs.normalize(GH,ITEM)])
        self.assertEqual(jobs.search_jobs('python SQL',location='amsterdam')['total_matches'],1)
        self.assertEqual(jobs.search_jobs("' OR 1=1 --")['total_matches'],0)
        self.assertIsNone(jobs.get_job_details('greenhouse:testco:1')['published_at'])
        self.assertEqual(jobs.get_skill_trends(['Python','Rust'])['counts'],{'Python':1,'Rust':0})
    def test_lever_qualifications_and_salary_preserved(self):
        row = jobs.normalize(dict(GH,source='lever'),{'id':'a','text':'Engineer','hostedUrl':'https://example.com/a',
             'descriptionPlain':'Build things','lists':[{'text':'Requirements','content':'<li>Python</li>'}],
             'salaryRange':{'currency':'USD','interval':'year','min':100000,'max':150000}})
        self.assertIn('Requirements',row['description']); self.assertIn('Python',row['description'])
        self.assertEqual(json.loads(row['payload'])['compensation']['salaryRange']['min'],100000)
    def test_ashby_schema(self):
        row = jobs.normalize(dict(GH,source='ashby'),{'id':'a','title':'Engineer','jobUrl':'https://example.com/a',
            'descriptionPlain':'Rust experience','location':'Remote','secondaryLocations':[{'location':'London'}],
            'publishedAt':'2026-09-01T00:00:00Z','compensation':{'summary':'GBP 100k'}})
        self.assertEqual(row['location'],'Remote; London')
        self.assertEqual(row['published_at'],'2026-09-01T00:00:00Z')
    def test_malformed_snapshot_rejected(self):
        with patch.object(jobs,'fetch',return_value={'jobs':[ITEM,{'id':2}]}):
            with self.assertRaises(ValueError): jobs.collect(GH)
    def test_lever_pagination(self):
        item = {'id':'1','text':'Engineer','hostedUrl':'https://example.com/a','descriptionPlain':'Python'}
        with patch.object(jobs,'fetch',side_effect=[[dict(item,id=str(i)) for i in range(100)],[dict(item,id='101')]]) as fetch, patch.object(jobs.time,'sleep'):
            self.assertEqual(len(jobs.collect(dict(GH,source='lever'))),101)
            self.assertIn('skip=100',fetch.call_args[0][0])

if __name__ == '__main__': unittest.main()
