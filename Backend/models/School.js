// import mongoose from "mongoose";

// const schoolSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   admin: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//   },
// }, { timestamps: true });

// export default mongoose.model("School", schoolSchema);
// models/School.js
import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

const School = mongoose.model("School", schoolSchema);

export default School;