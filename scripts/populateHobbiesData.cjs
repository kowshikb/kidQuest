// This file exports programmatically generated, rich hobby data.

const hobbiesBaseData = [
  {
    name: "Drawing & Art",
    category: "Creative Arts",
    icon: "🎨",
    skills: ["Fine Motor Skills", "Creativity"],
  },
  {
    name: "Music & Singing",
    category: "Creative Arts",
    icon: "🎵",
    skills: ["Auditory Skills", "Rhythm"],
  },
  {
    name: "Chess & Strategy",
    category: "Mind Sports",
    icon: "♟️",
    skills: ["Critical Thinking", "Strategy"],
  },
  {
    name: "Cooking & Baking",
    category: "Life Skills",
    icon: "🍳",
    skills: ["Following Instructions", "Basic Chemistry"],
  },
  {
    name: "Gardening",
    category: "Life Skills",
    icon: "🌱",
    skills: ["Patience", "Biology"],
  },
  {
    name: "Reading & Storytelling",
    category: "Language",
    icon: "📚",
    skills: ["Literacy", "Imagination"],
  },
  {
    name: "Coding for Kids",
    category: "STEM",
    icon: "💻",
    skills: ["Problem Solving", "Logic"],
  },
  {
    name: "DIY Crafts",
    category: "Creative Arts",
    icon: "✂️",
    skills: ["Creativity", "Manual Dexterity"],
  },
  {
    name: "Yoga & Mindfulness",
    category: "Health & Wellness",
    icon: "🧘",
    skills: ["Focus", "Flexibility"],
  },
  {
    name: "Photography",
    category: "Creative Arts",
    icon: "📷",
    skills: ["Composition", "Patience"],
  },
  {
    name: "Creative Writing",
    category: "Language",
    icon: "✍️",
    skills: ["Imagination", "Grammar"],
  },
  {
    name: "Building with LEGO",
    category: "STEM",
    icon: "🧱",
    skills: ["Spatial Reasoning", "Engineering"],
  },
  {
    name: "Learning a Language",
    category: "Language",
    icon: "🗣️",
    skills: ["Memory", "Communication"],
  },
  {
    name: "Playing an Instrument",
    category: "Creative Arts",
    icon: "🎸",
    skills: ["Discipline", "Fine Motor Skills"],
  },
  {
    name: "Running & Athletics",
    category: "Health & Wellness",
    icon: "🏃",
    skills: ["Stamina", "Discipline"],
  },
  {
    name: "Swimming",
    category: "Health & Wellness",
    icon: "🏊",
    skills: ["Stamina", "Coordination"],
  },
  {
    name: "Team Sports (Soccer, etc.)",
    category: "Health & Wellness",
    icon: "⚽",
    skills: ["Teamwork", "Strategy"],
  },
  {
    name: "Martial Arts",
    category: "Health & Wellness",
    icon: "🥋",
    skills: ["Discipline", "Respect"],
  },
  {
    name: "Dancing",
    category: "Creative Arts",
    icon: "💃",
    skills: ["Rhythm", "Coordination"],
  },
  {
    name: "Film Making",
    category: "Creative Arts",
    icon: "🎬",
    skills: ["Storytelling", "Technical Skills"],
  },
  {
    name: "Volunteering",
    category: "Social-Emotional",
    icon: "🤝",
    skills: ["Empathy", "Responsibility"],
  },
  {
    name: "Public Speaking",
    category: "Social-Emotional",
    icon: "🎤",
    skills: ["Confidence", "Communication"],
  },
  {
    name: "Magic Tricks",
    category: "Creative Arts",
    icon: "🎩",
    skills: ["Manual Dexterity", "Performance"],
  },
  {
    name: "Mental Math",
    category: "STEM",
    icon: "🧮",
    skills: ["Focus", "Numerical Fluency"],
  },
  {
    name: "Origami",
    category: "Creative Arts",
    icon: "🦢",
    skills: ["Patience", "Following Instructions"],
  },
  {
    name: "Calligraphy",
    category: "Creative Arts",
    icon: "✒️",
    skills: ["Patience", "Fine Motor Skills"],
  },
  {
    name: "Astronomy",
    category: "STEM",
    icon: "🔭",
    skills: ["Curiosity", "Pattern Recognition"],
  },
  {
    name: "Geology & Rock Collecting",
    category: "STEM",
    icon: "🗿",
    skills: ["Observation", "Patience"],
  },
  {
    name: "Bird Watching",
    category: "Nature",
    icon: "🐦",
    skills: ["Observation", "Patience"],
  },
  {
    name: "Hiking & Nature Walks",
    category: "Nature",
    icon: "🌲",
    skills: ["Endurance", "Observation"],
  },
];

const difficulties = ["Beginner", "Intermediate", "Advanced", "Expert"];
const ageGroups = [
  { min: 4, max: 7, label: "4-7 years" },
  { min: 8, max: 12, label: "8-12 years" },
  { min: 13, max: 18, label: "13-18 years" },
];

const generateTasksForLevel = (hobbyName, levelName, taskCount) => {
  const tasks = [];
  for (let i = 1; i <= taskCount; i++) {
    tasks.push({
      id: `${hobbyName.slice(0, 3).toLowerCase()}_${levelName
        .slice(0, 3)
        .toLowerCase()}_${i}`,
      day: i,
      title: `Practice ${hobbyName}: Day ${i}`,
      description: `A task to improve your ${hobbyName} skills at the ${levelName} stage.`,
      instructions: [
        "Read the goal for today.",
        "Complete the main activity.",
        "Reflect on what you learned.",
      ],
      estimatedTime: 15 + Math.floor(Math.random() * 45),
      difficulty: "Beginner", // Simplified for reliability
      coinReward: 50, // Simplified for reliability
      isActive: true,
    });
  }
  return tasks;
};

const generateHobbyData = () => {
  const allHobbies = [];
  let hobbyIdCounter = 1;

  // Ensure we have at least 50 base hobbies
  while (hobbiesBaseData.length < 50) {
    hobbiesBaseData.push({
      name: `Discovery Hobby #${hobbiesBaseData.length + 1}`,
      category: "General",
      icon: "⭐",
      skills: ["Adaptability", "Curiosity"],
    });
  }

  hobbiesBaseData.forEach((baseHobby) => {
    ageGroups.forEach((ageRange) => {
      const hobby = {
        id: `hobby_${hobbyIdCounter++}`,
        name: `${baseHobby.name} (${ageRange.label})`,
        description: `Explore the world of ${baseHobby.name} for the ${ageRange.label} age group.`,
        category: baseHobby.category,
        icon: baseHobby.icon,
        skills: baseHobby.skills,
        ageRange: { min: ageRange.min, max: ageRange.max },
        isActive: true,
        levels: [],
      };

      const levelCount = Math.floor(Math.random() * 3) + 2; // 2-4 levels
      for (let i = 1; i <= levelCount; i++) {
        const levelName = `Level ${i}`;
        const taskCount = Math.floor(Math.random() * 11) + 20; // 20-30 tasks

        hobby.levels.push({
          id: `${hobby.id}_level_${i}`,
          name: levelName,
          description: `This is ${levelName} of the ${hobby.name} hobby.`,
          badge: `🏅 ${baseHobby.name} Master Lvl ${i}`,
          badgeIcon: "🏅",
          totalDays: taskCount,
          ageRange: { min: ageRange.min, max: ageRange.max },
          order: i,
          isActive: true,
          tasks: generateTasksForLevel(baseHobby.name, levelName, taskCount),
        });
      }
      allHobbies.push(hobby);
    });
  });
  return allHobbies;
};

const hobbiesData = generateHobbyData();

module.exports = { hobbiesData };
