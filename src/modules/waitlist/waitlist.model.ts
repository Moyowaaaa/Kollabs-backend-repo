import mongoose, { Schema } from "mongoose";
import { IWaitlisterInterface } from "./waitlist.interface";

const waitlistersSchema = new Schema<IWaitlisterInterface>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

const WaitlisterModel = mongoose.model<IWaitlisterInterface>(
  "Waitlister",
  waitlistersSchema
);

export default WaitlisterModel;
