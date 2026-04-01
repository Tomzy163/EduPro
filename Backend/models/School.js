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
import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("School", schoolSchema);