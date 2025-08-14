import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [5, 'Email must be at least 5 characters long'],
        maxlength: [50, 'Email must be at most 50 characters long'],
    },
    password: {
        type: String,
        select : false,
    }
});

userSchema.statics.hashPassword = async function(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateJWT = function() {
    const token = jwt.sign(
        { email: this.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' } // Token expires in 24 hours
    );
    return token;
};

const User = mongoose.model("user", userSchema);

export default User;