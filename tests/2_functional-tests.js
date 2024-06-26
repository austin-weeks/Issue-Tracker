const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  let testIds = [];

  this.timeout(10000);
  test('create issue with every field', done => {
    chai.request(server)
      .keepOpen()
      .post('/api/issues/testing')
      .send({
        "issue_title": "post request test",
        "issue_text": "this is a test with all fields",
        "created_by": "chai testing suite",
        "assigned_to": "testers",
        "status_text": "in progress"
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isNotNull(res.body._id);
        assert.isNotNull(res.body.created_on);
        assert.isNotNull(res.body.updated_on);
        assert.equal(res.body.issue_title, 'post request test');
        assert.equal(res.body.issue_text, 'this is a test with all fields');
        assert.equal(res.body.created_by, 'chai testing suite');
        assert.equal(res.body.assigned_to, 'testers');
        assert.equal(res.body.status_text, 'in progress');
        assert.isTrue(res.body.open);
        testIds.push(res.body._id);
        done();
      });
  });
  test('create isssues with only required fields', done => {
    chai.request(server)
      .keepOpen()
      .post('/api/issues/testing')
      .send({
        "issue_title": "post request test 2",
        "issue_text": "this is a test with only required fields",
        "created_by": "chai testing suite",
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isNotNull(res.body._id);
        assert.isNotNull(res.body.created_on);
        assert.isNotNull(res.body.updated_on);
        assert.equal(res.body.issue_title, 'post request test 2');
        assert.equal(res.body.issue_text, 'this is a test with only required fields');
        assert.equal(res.body.created_by, 'chai testing suite');
        assert.isEmpty(res.body.assigned_to);
        assert.isEmpty(res.body.status_text);
        assert.isTrue(res.body.open);
        testIds.push(res.body._id);
        done();
      });
  });
  test('create isssue with missing required fields', done => {
    chai.request(server)
      .keepOpen()
      .post('/api/issues/testing')
      .send({
        "asssigned_to": "testers"
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'issue title, text, and created_by fields are required.');
        done();
      });
  });
  test('view issues on a project', done => {
    chai.request(server)
      .keepOpen()
      .get('/api/issues/testing')
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        done();
      });
  });
  test('view issues on a project with one filter', done => {
    chai.request(server)
      .keepOpen()
      .get('/api/issues/testing?status_text=in%20progress')
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtLeast(res.body.length, 1);
        done();
      });
  });
  test('view issues on a project with multiple filters', done => {
    chai.request(server)
      .keepOpen()
      .get('/api/issues/testing?status_text=in%20progress&open=true')
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtLeast(res.body.length, 1);
        done();
      });
  });
  test('update one field on an issue', done => {
    chai.request(server)
      .keepOpen()
      .put('/api/issues/testing')
      .send({
        _id: testIds[0],
        issue_text: 'this issue has been updated!'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body._id, testIds[0]);
        assert.equal(res.body.issue_text, 'this issue has been updated!');
        done();
      });
  });
  test('update multiple fields on an issue', done => {
    chai.request(server)
      .keepOpen()
      .put('/api/issues/testing')
      .send({
        _id: testIds[0],
        issue_title: 'updated issue',
        issue_text: 'this issue has been updated again!'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body._id, testIds[0]);
        assert.equal(res.body.issue_title, 'updated issue');
        assert.equal(res.body.issue_text, 'this issue has been updated again!');
        done();
      });
  });
  test('update an issue with missing _id', done => {
    chai.request(server)
      .keepOpen()
      .put('/api/issues/testing')
      .send({
        issue_text: 'trying to update this issue!'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, '_id field is required.');
        done();
      });
  });
  test('update an issue with no fields', done => {
    chai.request(server)
      .keepOpen()
      .put('/api/issues/testing')
      .send({})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, '_id field is required.');
        done();
      });
  });
  test('update an issue with an invalid _id', done => {
    chai.request(server)
      .keepOpen()
      .put('/api/issues/testing')
      .send({
        _id: 'fdsajfie3jfjis',
        issue_text: 'trying to update this issue!'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'The issue _id provided does not match an existing project issue.');
        done();
      });
  });
  test('delete an issue', done => {
    chai.request(server)
      .keepOpen()
      .delete('/api/issues/testing')
      .send({
        _id: testIds[1]
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.result, 'successfully deleted');
        assert.equal(res.body._id, testIds[1]);
        done();
      });
  });
  test('delete an issue with an invalid _id', done => {
    chai.request(server)
      .keepOpen()
      .delete('/api/issues/testing')
      .send({
        _id: 'j3u1983u4rdsjkap'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'The issue _id does not match an exist project issue.');
        done();
      });
  });
  test('delete an issue with a missing _id', done => {
    chai.request(server)
      .keepOpen()
      .delete('/api/issues/testing')
      .send({})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'Please provide an issue _id');
        done();
      });
  });
});
