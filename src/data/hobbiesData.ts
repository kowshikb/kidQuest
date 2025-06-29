import { Hobby, HobbyTask, HobbyLevel } from "../api/hobbiesApi";
import { Timestamp } from "firebase/firestore";

// Helper function to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper function to create timestamp
const createTimestamp = () => Timestamp.now();

// Hobby categories with specific hobbies
const hobbyCategories = {
  "Art & Creative": [
    "Drawing",
    "Painting",
    "Sketching",
    "Coloring",
    "Calligraphy",
    "Origami",
    "Pottery",
    "Sculpture",
    "Paper Crafts",
    "Scrapbooking",
    "Digital Art",
  ],
  "Music & Performance": [
    "Singing",
    "Piano",
    "Guitar",
    "Violin",
    "Drums",
    "Dancing",
    "Theater",
    "Public Speaking",
    "Magic Tricks",
    "Storytelling",
  ],
  "Literature & Language": [
    "Reading",
    "Creative Writing",
    "Poetry",
    "Journaling",
    "Blogging",
    "Language Learning",
    "Book Club",
    "Script Writing",
    "Letter Writing",
  ],
  "Sports & Fitness": [
    "Cricket",
    "Football",
    "Basketball",
    "Badminton",
    "Table Tennis",
    "Tennis",
    "Swimming",
    "Running",
    "Cycling",
    "Yoga",
    "Exercise",
    "Martial Arts",
  ],
  "Mindful & Wellness": [
    "Meditation",
    "Mindfulness",
    "Breathing Exercises",
    "Stretching",
    "Nature Walks",
    "Gardening",
    "Pet Care",
    "Wellness Journaling",
  ],
  "STEM & Technology": [
    "Coding",
    "Robotics",
    "Science Experiments",
    "Math Games",
    "Engineering Projects",
    "3D Printing",
    "Electronics",
    "App Development",
    "Web Design",
  ],
  "Outdoor & Adventure": [
    "Hiking",
    "Camping",
    "Bird Watching",
    "Nature Photography",
    "Rock Collecting",
    "Star Gazing",
    "Weather Watching",
    "Outdoor Games",
    "Treasure Hunting",
  ],
  "Life Skills & Practical": [
    "Cooking",
    "Baking",
    "Home Organization",
    "Basic Repairs",
    "Sewing",
    "First Aid",
    "Money Management",
    "Time Management",
    "Planning",
  ],
};

// Age groups for hobbies
const ageGroups = [
  { min: 5, max: 8, label: "5-8 years" },
  { min: 9, max: 12, label: "9-12 years" },
  { min: 13, max: 16, label: "13-16 years" },
  { min: 17, max: 25, label: "17-25 years" },
];

// Difficulty levels for hobbies
const difficulties: ("Beginner" | "Intermediate" | "Advanced" | "Expert")[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
];

// Generate tasks for each hobby level
const generateHobbyTasks = (
  hobbyName: string,
  levelName: string,
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert",
  count: number
): HobbyTask[] => {
  const tasks: HobbyTask[] = [];

  for (let i = 1; i <= count; i++) {
    const coinReward =
      difficulty === "Beginner"
        ? 5 + i * 2
        : difficulty === "Intermediate"
        ? 8 + i * 3
        : difficulty === "Advanced"
        ? 12 + i * 4
        : 15 + i * 5;

    tasks.push({
      id: generateId(),
      day: i,
      title: `${hobbyName} - ${levelName} Day ${i}`,
      description: `Day ${i} of your ${hobbyName} journey in ${levelName} level. Build your skills step by step!`,
      instructions: [
        `Start with basic preparation for ${hobbyName}`,
        `Follow the guided steps carefully`,
        `Practice the techniques shown`,
        `Complete the daily challenge`,
        `Reflect on your progress`,
      ],
      estimatedTime:
        difficulty === "Beginner"
          ? 10 + i * 2
          : difficulty === "Intermediate"
          ? 15 + i * 3
          : difficulty === "Advanced"
          ? 20 + i * 4
          : 25 + i * 5,
      difficulty,
      materials: [
        `Basic ${hobbyName} supplies`,
        "Notebook for tracking",
        "Timer",
      ],
      parentGuidance:
        difficulty === "Beginner" || difficulty === "Intermediate",
      coinReward,
      ageRange: ageGroups[Math.floor(Math.random() * ageGroups.length)],
      isActive: true,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp(),
      prerequisites: i > 1 ? [tasks[i - 2].id] : undefined,
    });
  }

  return tasks;
};

// Generate levels for each hobby
const generateHobbyLevels = (
  hobbyName: string,
  ageGroup: { min: number; max: number }
): HobbyLevel[] => {
  const levels: HobbyLevel[] = [];

  difficulties.forEach((difficulty, index) => {
    const taskCount = Math.floor(Math.random() * 6) + 20; // 20-25 tasks per level
    const tasks = generateHobbyTasks(
      hobbyName,
      `${difficulty} Level`,
      difficulty,
      taskCount
    );

    const level: HobbyLevel = {
      id: generateId(),
      name: `${difficulty} Level`,
      description: `Master ${hobbyName} at ${difficulty.toLowerCase()} level with daily practice and challenges`,
      tasks,
      badge: `${hobbyName} ${difficulty}`,
      badgeIcon: `🏆`,
      unlockMessage: `Congratulations! You've unlocked ${difficulty} level in ${hobbyName}!`,
      prerequisite: index > 0 ? levels[index - 1].id : undefined,
      totalDays: tasks.length,
      totalCoins: tasks.reduce((sum, task) => sum + task.coinReward, 0),
      ageRange: ageGroup,
      order: index + 1,
      isActive: true,
    };

    levels.push(level);
  });

  return levels;
};

// Generate all hobbies
export const generateHobbies = (): Hobby[] => {
  const allHobbies: Hobby[] = [];
  let hobbyId = 1;

  Object.entries(hobbyCategories).forEach(([category, hobbies]) => {
    hobbies.forEach((hobbyName) => {
      // Create hobby for each age group to ensure variety
      ageGroups.forEach((ageGroup) => {
        const levels = generateHobbyLevels(hobbyName, ageGroup);

        const hobby: Hobby = {
          id: `hobby_${hobbyId}`,
          name: `${hobbyName} (Ages ${ageGroup.min}-${ageGroup.max})`,
          description: `Discover the joy of ${hobbyName}! Perfect for ages ${ageGroup.min}-${ageGroup.max}. Build skills, creativity, and confidence through structured daily practice.`,
          category,
          icon: getHobbyIcon(hobbyName),
          imageUrl: `/images/hobbies/${hobbyName
            .toLowerCase()
            .replace(/\s+/g, "-")}.jpg`,
          ageRange: ageGroup,
          levels,
          totalDays: levels.reduce((sum, level) => sum + level.totalDays, 0),
          skills: getHobbySkills(hobbyName),
          popularityRank: hobbyId,
          isActive: true,
          isLocked: false,
          createdAt: createTimestamp(),
          updatedAt: createTimestamp(),
          totalCoins: levels.reduce((sum, level) => sum + level.totalCoins, 0),
        };

        allHobbies.push(hobby);
        hobbyId++;

        // Stop when we reach 50 hobbies
        if (allHobbies.length >= 50) return;
      });
      if (allHobbies.length >= 50) return;
    });
    if (allHobbies.length >= 50) return;
  });

  return allHobbies.slice(0, 50); // Ensure exactly 50 hobbies
};

// Helper function to get hobby icon
const getHobbyIcon = (hobbyName: string): string => {
  const iconMap: { [key: string]: string } = {
    Drawing: "✏️",
    Painting: "🎨",
    Sketching: "✏️",
    Coloring: "🖍️",
    Singing: "🎵",
    Piano: "🎹",
    Guitar: "🎸",
    Dancing: "💃",
    Reading: "📚",
    Writing: "✍️",
    Cricket: "🏏",
    Football: "⚽",
    Cooking: "👨‍🍳",
    Meditation: "🧘",
    Gardening: "🌱",
    Coding: "💻",
    Photography: "📸",
    Hiking: "🥾",
    Swimming: "🏊",
    Yoga: "🧘‍♀️",
  };

  return iconMap[hobbyName] || "🎯";
};

// Helper function to get hobby skills
const getHobbySkills = (hobbyName: string): string[] => {
  const skillMap: { [key: string]: string[] } = {
    Drawing: ["Creativity", "Hand-eye coordination", "Observation", "Patience"],
    Singing: [
      "Musical expression",
      "Confidence",
      "Breathing control",
      "Performance",
    ],
    Reading: ["Comprehension", "Vocabulary", "Focus", "Imagination"],
    Cricket: ["Teamwork", "Strategy", "Physical fitness", "Coordination"],
    Cooking: ["Following instructions", "Measurement", "Safety", "Creativity"],
    Meditation: [
      "Mindfulness",
      "Focus",
      "Emotional regulation",
      "Stress management",
    ],
    Coding: ["Logic", "Problem solving", "Creativity", "Patience"],
  };

  return (
    skillMap[hobbyName] || [
      "Skill development",
      "Practice",
      "Patience",
      "Growth",
    ]
  );
};

// Export the generated hobby data
export const hobbies = generateHobbies();

// Export categories for filtering
export const hobbyCategoriesForFilter = Object.keys(hobbyCategories);

// Export age groups for filtering
export const hobbyAgeGroups = ageGroups.map((group) => group.label);

// Export difficulties for filtering
export const hobbyDifficulties = difficulties;
