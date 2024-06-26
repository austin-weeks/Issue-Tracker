'use strict';
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

mongoose.connect(process.env.MONGO_URI);
const Project = mongoose.model('Project', new mongoose.Schema({
  project_title: String,
  issues: Array
}));
const Issue = {
  issue_title: String,
  issue_text: String,
  created_on: Date,
  updated_on: Date,
  created_by: String,
  assigned_to: String,
  status_text: String,
  open: Boolean
}

async function getOrCreateProject(projectName) {
  let project = await Project.findOne({project_title: projectName});
  if (!project) {
    project = await new Project({
      project_title: projectName,
      issues: []
    }).save();
  }
  return project;
}

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(async (req, res) => {
      let project = req.params.project;
      if (!project) {
        res.send('Please enter a project name.');
        return;
      }
      let projectDB = await getOrCreateProject(project);
      const queries = req.query;
      const filteredIssues = projectDB.issues.filter(el => {
        if (queries.hasOwnProperty('issue_title') && el.issue_title !== queries.issue_title) return false;
        if (queries.hasOwnProperty('issue_text') && el.issue_text !== queries.issue_text) return false;
        if (queries.hasOwnProperty('created_on') && el.created_on !== queries.created_on) return false;
        if (queries.hasOwnProperty('updated_on') && el.updated_on !== queries.updated_on) return false;
        if (queries.hasOwnProperty('created_by') && el.created_by !== queries.created_by) return false;
        if (queries.hasOwnProperty('assigned_to') && el.assigned_to !== queries.assigned_to) return false;
        if (queries.hasOwnProperty('status_text') && el.status_text !== queries.status_text) return false;
        if (queries.hasOwnProperty('open') && el.open.toString() !== queries.open) return false;
        return true;
      });
      res.json(filteredIssues);
    })
    
    .post(async (req, res) => {
      let project = req.params.project;
      if (!project) {
        res.send('Please provide a project name.');
        return;
      }
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;
      if (!issue_title || !issue_text || !created_by) {
        res.send('issue title, text, and created_by fields are required.');
        return;
      }
      let projectDB = await getOrCreateProject(project);
      const issue = {
        _id: new ObjectId(),
        issue_title: issue_title,
        issue_text: issue_text,
        created_on: new Date(),
        updated_on: new Date(),
        created_by: created_by,
        assigned_to: assigned_to || "",
        status_text: status_text || "",
        open: true
      }
      projectDB.issues.push(issue);
      await projectDB.save();
      res.json(issue);
    })
    
    .put(async (req, res) => {
      let project = req.params.project;
      if (!project) {
        res.send('Please provide a project name.');
        return;
      }
      const { _id, issue_title, issue_text, created_by, assigned_to, status_text, open } = req.body;
      if (!_id) {
        res.send('_id field is required.');
        return;
      }
      let projectDB = await getOrCreateProject(project);
      const issue = projectDB.issues.find(el => el._id.toString() === _id);
      if (!issue) {
        res.send(`The issue _id provided does not match an existing project issue.`);
        return;
      }
      const issueIndex = projectDB.issues.indexOf(issue);
      const updatedIssue = {
        _id: issue._id,
        issue_title: issue_title || issue.issue_title,
        issue_text: issue_text || issue.issue_text,
        created_on: issue.created_on,
        updated_on: new Date(),
        created_by: created_by || issue.created_by,
        assigned_to: assigned_to || issue.assigned_to,
        status_text: status_text || issue.status_text,
        open: open || issue.open
      }
      projectDB.issues[issueIndex] = updatedIssue;
      await projectDB.save();
      res.json(updatedIssue);
    })
    
    .delete(async (req, res) => {
      let project = req.params.project;
      if (!project) {
        res.send('Please provide a project name.');
        return;
      }
      const _id = req.body._id;
      if (!_id) {
        res.send('Please provide an issue _id');
        return;
      }
      let projectDB = await getOrCreateProject(project);
      const issue = projectDB.issues.find(el => el._id.toString() === _id);
      if (!issue) {
        res.send('The issue _id does not match an exist project issue.');
        return;
      }
      const filteredIssues = projectDB.issues.filter(el => el._id.toString() !== _id);
      projectDB.issues = filteredIssues;
      await projectDB.save();
      res.json({
        result: 'successfully deleted',
        _id
      })
    });
    
};
