const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    complaintId: { type: String, unique: true },
    originalDescription: { type: String, required: true },
    enhancedDescription: { type: String },
    imageUrl: { type: String, required: true },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    confidence: { type: Number },
    riskAnalysis: { type: String },
    suggestedDepartment: { type: String },
    estimatedPriority: { type: String },
    priorityScore: { type: Number },
    status: { type: String, enum: ['Pending', 'Assigned', 'In Progress', 'Resolved'], default: 'Pending' },
    location: {
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String }
    },
    evidence: {
        sceneMatch: { type: Number, default: 0 },
        gpsAvailable: { type: Boolean, default: false },
        locationVerified: { type: Boolean, default: false },
        metadataAvailable: { type: Boolean, default: false },
        overallStrength: { type: Number, default: 0 },
        reasoning: { type: [String], default: [] }
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // To be implemented with auth
}, { timestamps: true });

complaintSchema.pre('save', function() {
    if (!this.complaintId) {
        // Generate a random ID like CM-1024
        this.complaintId = 'CM-' + Math.floor(1000 + Math.random() * 9000);
    }
});

module.exports = mongoose.model('Complaint', complaintSchema);
