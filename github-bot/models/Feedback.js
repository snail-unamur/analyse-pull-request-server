const mongoose = require('mongoose');
const { Schema, SchemaTypes, model } = mongoose;

const feedbackSchema = new Schema({
  repo:{
    type: SchemaTypes.ObjectId,
    ref: 'Repository',
  },
  avg_likert_scale_point: Number,
  feedback_count: String,
  analysis: {
    type: SchemaTypes.ObjectId,
    ref: 'Analysis',
    user_name: String,
    user_role: String,
    avg_likert_scale_point: Number,
    written_feedback: String,
    read_status: Boolean,
  }
});

const Feedback = model("Feedback", feedbackSchema);
module.exports = Feedback;
