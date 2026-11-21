import mongoose from 'mongoose';

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A name is required.'],
    trim: true,
    minlength: [1, 'A name cannot be empty.'],
    maxlength: [24, 'Names can be at most 24 characters.'],
  },
  color: {
    type: String,
    default: '#e6f0df',
    match: [/^#[0-9a-fA-F]{6}$/, 'Color must be a six digit hex value.'],
  },
}, { timestamps: true });

export default mongoose.model('Person', personSchema);
