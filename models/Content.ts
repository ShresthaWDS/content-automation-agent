import mongoose, { Schema } from "mongoose";

const ContentSchema = new Schema(
  {
    title: String,
    rawContent: String,
    xContent: String,
    linkedinContent: String,
    status: { type: String, default: "draft" },
  },
  { timestamps: true }
);

export default mongoose.models.Content ||
  mongoose.model("Content", ContentSchema);