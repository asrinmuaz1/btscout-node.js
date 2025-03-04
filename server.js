const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" })); // Tüm kaynaklara izin ver
app.use(express.static("public"));

let teams = {};

app.post("/match", (req, res) => {
    console.log("Match data received:", req.body);
    try {
        const { teamNumber, autonomousObject, autonomousLeft, os1, os2, os3, os4, ts1, ts2, ts3, ts4, processor, net, park, shallowCage, deepCage, comment } = req.body;
        if (!teamNumber) return res.status(400).json({ message: "Team number required" });

        const scores = {
            "L1 (AUTO)": parseInt(os1 || 0),
            "L2 (AUTO)": parseInt(os2 || 0),
            "L3 (AUTO)": parseInt(os3 || 0),
            "L4 (AUTO)": parseInt(os4 || 0),
            "L1 (TELEOP)": parseInt(ts1 || 0),
            "L2 (TELEOP)": parseInt(ts2 || 0),
            "L3 (TELEOP)": parseInt(ts3 || 0),
            "L4 (TELEOP)": parseInt(ts4 || 0),
            "Processor": parseInt(processor || 0),
            "Net": parseInt(net || 0),
            "Park": parseInt(park || 0),
            "Shallow CAGE": parseInt(shallowCage || 0),
            "Deep CAGE": parseInt(deepCage || 0)
        };

        let totalPoints = Object.values(scores).reduce((sum, val) => sum + val, 0);
        if (autonomousLeft === true) totalPoints += 3;

        const topCategory = Object.entries(scores).reduce((max, current) => (current[1] > max[1] ? current : max), ["None", 0])[0];

        if (teams[teamNumber]) {
            teams[teamNumber].points += totalPoints;
            if (scores[topCategory] > 0) teams[teamNumber].topCategory = topCategory;
            if (autonomousObject === true) teams[teamNumber].autonomousCapable = true;
            if (comment && comment.trim() !== "") teams[teamNumber].comments.push(comment);
        } else {
            teams[teamNumber] = {
                teamNumber,
                points: totalPoints,
                topCategory: totalPoints > 0 ? topCategory : "None",
                autonomousCapable: autonomousObject === true,
                comments: comment && comment.trim() !== "" ? [comment] : []
            };
        }

        res.json({ message: "Match recorded!", team: teams[teamNumber] });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Server error occurred" });
    }
});

app.get("/ranking", (req, res) => {
    const ranking = Object.values(teams).sort((a, b) => b.points - a.points);
    res.json(ranking);
});

app.post("/reset", (req, res) => {
    const { password } = req.body;
    const correctPassword = "reset123";
    if (password === correctPassword) {
        teams = {};
        res.json({ message: "Ranking reset!" });
    } else {
        res.status(403).json({ message: "Incorrect password!" });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));