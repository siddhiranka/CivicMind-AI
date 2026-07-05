const Complaint = require('../models/Complaint');
const { cloudinary } = require('../config/cloudinary');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.createComplaint = async (req, res) => {
    try {
        const { description, hasGps, lat, lng } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'Image is required' });
        }

        // 1. Convert to Base64 URI (Bypassing Cloudinary for MVP)
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        let dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;
        
        const uploadResponse = { secure_url: dataURI };

        // 2. Analyze with Gemini Vision
        const prompt = `Analyze this image in the context of community infrastructure and safety. 
        The user described the location and issue as: "${description}".
        User GPS Data Provided: ${hasGps === 'true' ? 'YES (Lat: ' + lat + ', Lng: ' + lng + ')' : 'NO'}.
        
        CRITICAL TASK: Act as an Enterprise Decision Intelligence AI. 
        You must perform a strict AI Evidence Assessment to verify the claim. Do not blindly trust the user.
        
        Return a strict JSON object with the following structure:
        {
            "isGenuine": true, // false if it's a blatant stock photo/meme/unrelated
            "evidenceAssessment": {
                "sceneMatch": 95, // 0-100 score of how well image matches description
                "locationVerified": false, // boolean, can you visually confirm it's the exact claimed location?
                "confidence": 90, // 0-100 score of your visual analysis confidence
                "overallStrength": 85, // 0-100 aggregate evidence score
                "reasoning": [
                    "Water accumulation detected.",
                    "Buildings appear flooded.",
                    "Exact location cannot be verified from visual evidence alone."
                ]
            },
            "issueDetected": "Short title of the issue",
            "enhancedDescription": "A professional, detailed complaint description.",
            "severity": "Low, Medium, High, or Critical",
            "risk": "Short description of potential consequences",
            "suggestedDepartment": "e.g., Road Maintenance",
            "estimatedPriority": "e.g., Immediate",
            "priorityScore": 95, // 0-100
            "recommendedAction": "e.g., Send inspection team immediately."
        }`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: req.file.mimetype,
                        data: b64
                    }
                }
            ],
            config: {
                systemInstruction: "You are CivicMind's elite Fraud Detection and Infrastructure AI. Your primary job is to aggressively reject fake, stock, or meme images submitted by users, and only process genuine, amateur photos of real-world civic issues. Be highly skeptical.",
                responseMimeType: "application/json"
            }
        });

        let aiResult = {};
        try {
            aiResult = JSON.parse(response.text);
        } catch(e) {
            console.error("Failed to parse Gemini output:", response.text);
            aiResult = {
                isGenuine: false,
                evidenceAssessment: {
                    sceneMatch: 0, locationVerified: false, confidence: 0, overallStrength: 0,
                    reasoning: ["Failed to parse AI response."]
                },
                issueDetected: "Unknown",
                enhancedDescription: description,
                severity: "Medium",
                risk: "Unknown",
                suggestedDepartment: "General",
                estimatedPriority: "Normal",
                priorityScore: 50,
                recommendedAction: "Manual review required"
            };
        }

        // Generate random mock location if not provided
        let finalLat = hasGps === 'true' && lat ? parseFloat(lat) : 40.7128 + (Math.random() - 0.5) * 0.1;
        let finalLng = hasGps === 'true' && lng ? parseFloat(lng) : -74.0060 + (Math.random() - 0.5) * 0.1;

        // 3. Save to MongoDB
        let newComplaint = null;
        if (aiResult.isGenuine || !aiResult.isGenuine) {
            // We now save everything but mark fake ones with low score for dashboard review
            newComplaint = new Complaint({
                originalDescription: description,
                enhancedDescription: aiResult.enhancedDescription,
                imageUrl: uploadResponse.secure_url,
                severity: aiResult.severity,
                confidence: aiResult.evidenceAssessment?.confidence || 50,
                riskAnalysis: aiResult.risk,
                suggestedDepartment: aiResult.suggestedDepartment,
                estimatedPriority: aiResult.estimatedPriority,
                priorityScore: aiResult.priorityScore,
                status: 'Pending',
                location: { lat: finalLat, lng: finalLng, address: 'Reported Location' },
                evidence: {
                    sceneMatch: aiResult.evidenceAssessment?.sceneMatch || 0,
                    gpsAvailable: hasGps === 'true',
                    locationVerified: aiResult.evidenceAssessment?.locationVerified || false,
                    metadataAvailable: false,
                    overallStrength: aiResult.evidenceAssessment?.overallStrength || 0,
                    reasoning: aiResult.evidenceAssessment?.reasoning || []
                }
            });
            await newComplaint.save();
        }

        res.status(201).json({
            message: 'Complaint created successfully',
            complaint: newComplaint,
            aiAnalysis: aiResult
        });
    } catch (error) {
        console.error('Error creating complaint:', error);
        res.status(500).json({ error: 'Failed to process complaint' });
    }
};

exports.getComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        res.status(200).json(complaints);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch complaints' });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(id, { status }, { new: true });
        if (!complaint) return res.status(404).json({ error: 'Not found' });
        res.status(200).json(complaint);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update status' });
    }
};

exports.trackComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const complaint = await Complaint.findOne({ complaintId: id });
        if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
        res.status(200).json(complaint);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.seedComplaints = async (req, res) => {
    try {
        await Complaint.deleteMany({});
        const dummyData = [
            {
                complaintId: 'CM-1001',
                originalDescription: 'Huge pothole on main street, dangerous for bikes',
                enhancedDescription: 'A severe pothole on Main Street posing a high accident risk to two-wheelers.',
                imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400',
                severity: 'Critical',
                confidence: 95,
                riskAnalysis: 'High accident risk, potential vehicle damage.',
                suggestedDepartment: 'Road Maintenance',
                estimatedPriority: 'Immediate',
                priorityScore: 98,
                status: 'Pending',
                location: { lat: 19.1136, lng: 72.8697, address: 'Andheri East, Mumbai' },
                evidence: { sceneMatch: 95, gpsAvailable: true, locationVerified: true, overallStrength: 92, reasoning: ['Clear visual of pothole', 'GPS matches'] }
            },
            {
                complaintId: 'CM-1002',
                originalDescription: 'Garbage overflowing for 3 days',
                enhancedDescription: 'Accumulated solid waste overflowing from public bins, causing health hazards.',
                imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=400',
                severity: 'High',
                confidence: 90,
                riskAnalysis: 'Public health hazard, foul odor, disease spread.',
                suggestedDepartment: 'Waste Management',
                estimatedPriority: 'High',
                priorityScore: 85,
                status: 'Assigned',
                location: { lat: 19.1843, lng: 72.8360, address: 'Malad West, Mumbai' },
                evidence: { sceneMatch: 90, gpsAvailable: false, locationVerified: false, overallStrength: 75, reasoning: ['Visible waste overflow'] }
            },
            {
                complaintId: 'CM-1003',
                originalDescription: 'Water pipe leaking heavily',
                enhancedDescription: 'Major water leakage from a main supply pipe, leading to significant water wastage.',
                imageUrl: 'https://images.unsplash.com/photo-1581693003058-2082b26c63b4?auto=format&fit=crop&q=80&w=400',
                severity: 'High',
                confidence: 88,
                riskAnalysis: 'Water wastage, potential road damage.',
                suggestedDepartment: 'Water Supply',
                estimatedPriority: 'High',
                priorityScore: 80,
                status: 'In Progress',
                location: { lat: 19.0760, lng: 72.8777, address: 'Kurla, Mumbai' },
                evidence: { sceneMatch: 85, gpsAvailable: true, locationVerified: true, overallStrength: 88, reasoning: ['Continuous flow visible'] }
            },
            {
                complaintId: 'CM-1004',
                originalDescription: 'Street light not working',
                enhancedDescription: 'Non-functional street light causing dark zones at night.',
                imageUrl: 'https://images.unsplash.com/photo-1517409241857-e435985bdf0b?auto=format&fit=crop&q=80&w=400',
                severity: 'Medium',
                confidence: 92,
                riskAnalysis: 'Increased risk of theft and accidents at night.',
                suggestedDepartment: 'Electricity Board',
                estimatedPriority: 'Medium',
                priorityScore: 60,
                status: 'Resolved',
                location: { lat: 19.0144, lng: 72.8479, address: 'Dadar, Mumbai' },
                evidence: { sceneMatch: 90, gpsAvailable: true, locationVerified: true, overallStrength: 85, reasoning: ['Darkened pole visible'] }
            }
        ];
        await Complaint.insertMany(dummyData);
        res.status(200).json({ message: 'Database seeded successfully', count: dummyData.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to seed database' });
    }
};
