import { QuestTheme, QuestTask } from "../api/questsApi";
import { Timestamp } from "firebase/firestore";

// Helper function to generate task IDs
const generateTaskId = () => `task_${Math.random().toString(36).substr(2, 9)}`;

// Helper function to create timestamp
const createTimestamp = () => Timestamp.now();

// Quest categories with detailed themes
const questCategories = {
  "Mind & Intelligence": [
    "Problem Solving",
    "Logical Reasoning",
    "Puzzles & Brain Games",
    "Memory Techniques",
    "Critical Thinking",
    "Focus & Attention",
    "Mental Math",
    "Abacus",
    "Strategy Games",
  ],
  "Academics & Knowledge": [
    "Math Mastery",
    "Science Explorations",
    "Nature Studies",
    "English Language Skills",
    "Vocabulary Building",
    "Reading Comprehension",
    "Creative Writing",
    "General Knowledge",
    "Financial Literacy",
    "History and Cultures",
    "Geography",
    "Physics Concepts",
    "Chemistry Basics",
    "Biology Adventures",
    "Space Exploration",
    "Environmental Science",
  ],
  "Emotional & Social Skills": [
    "Gratitude Practice",
    "Resilience Building",
    "Mindfulness",
    "Empathy & Compassion",
    "Self-Awareness",
    "Confidence & Self-Esteem",
    "Anger Management",
    "Conflict Resolution",
    "Teamwork",
    "Communication Skills",
    "Leadership Development",
    "Friendship Building",
  ],
  "Practical Life Skills": [
    "Money Management",
    "Budgeting",
    "Cooking Basics",
    "Time Management",
    "Planning & Scheduling",
    "Home Safety",
    "First Aid Basics",
    "Gardening",
    "Environmental Awareness",
    "Digital Literacy",
    "Personal Hygiene",
    "Organization Skills",
    "Decision Making",
    "Goal Setting",
  ],
  "Character & Behavior": [
    "Respect & Courtesy",
    "Kindness & Helping Nature",
    "Honesty & Integrity",
    "Leadership Skills",
    "Responsibility",
    "Discipline & Habits",
    "Patience & Perseverance",
    "Courage Building",
    "Sharing & Caring",
    "Forgiveness",
    "Tolerance",
    "Cultural Appreciation",
  ],
  "Maker & Builder Skills": [
    "DIY Projects",
    "Engineering Basics",
    "Robotics",
    "Building with LEGO",
    "Tinkering & Fixing Things",
    "3D Thinking",
    "Construction Concepts",
    "Tool Usage",
    "Simple Machines",
    "Creative Building",
  ],
};

// Age groups for quests
const ageGroups = [
  { min: 5, max: 8, label: "5-8 years" },
  { min: 9, max: 12, label: "9-12 years" },
  { min: 13, max: 16, label: "13-16 years" },
  { min: 17, max: 25, label: "17-25 years" },
];

// Difficulty levels
const difficulties: ("Easy" | "Medium" | "Hard")[] = ["Easy", "Medium", "Hard"];

// Generate tasks for each quest theme
const generateQuestTasks = (
  themeName: string,
  difficulty: "Easy" | "Medium" | "Hard",
  count: number
): QuestTask[] => {
  const tasks: QuestTask[] = [];

  for (let i = 1; i <= count; i++) {
    const taskTypes: QuestTask["type"][] = [
      "quiz",
      "activity",
      "creative",
      "matching",
      "drawing",
      "reading",
      "group",
    ];
    const coinReward =
      difficulty === "Easy"
        ? 10 + i * 2
        : difficulty === "Medium"
        ? 15 + i * 3
        : 20 + i * 5;

    tasks.push({
      id: generateTaskId(),
      title: `${themeName} - Task ${i}`,
      description: `Complete this ${difficulty.toLowerCase()} level task in ${themeName}. This will help you develop important skills and earn rewards!`,
      coinReward,
      type: taskTypes[i % taskTypes.length],
      difficulty,
      estimatedTime:
        difficulty === "Easy"
          ? 5 + i * 2
          : difficulty === "Medium"
          ? 10 + i * 3
          : 15 + i * 5,
      ageRange: ageGroups[Math.floor(Math.random() * ageGroups.length)],
      isActive: true,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp(),
      prerequisites: i > 1 ? [tasks[i - 2].id] : undefined,
    });
  }

  return tasks;
};

// Generate all quest themes
export const generateQuestThemes = (): QuestTheme[] => {
  const allThemes: QuestTheme[] = [];
  let questId = 1;

  Object.entries(questCategories).forEach(([category, themes]) => {
    themes.forEach((themeName) => {
      difficulties.forEach((difficulty) => {
        ageGroups.forEach((ageGroup) => {
          const taskCount = Math.floor(Math.random() * 21) + 50; // 50-70 tasks per quest
          const tasks = generateQuestTasks(themeName, difficulty, taskCount);

          const theme: QuestTheme = {
            id: `quest_${questId}`,
            name: `${themeName} - ${difficulty} Level`,
            description: `Master ${themeName} skills through engaging ${difficulty.toLowerCase()} level activities. Perfect for ages ${
              ageGroup.min
            }-${ageGroup.max}!`,
            category,
            difficulty,
            imageUrl: `/images/quests/${category
              .toLowerCase()
              .replace(/\s+/g, "-")}.jpg`,
            ageRange: ageGroup,
            isActive: true,
            order: questId,
            tasks,
            totalTasks: tasks.length,
            totalRewards: tasks.reduce((sum, task) => sum + task.coinReward, 0),
            estimatedDuration: tasks.reduce(
              (sum, task) => sum + task.estimatedTime,
              0
            ),
            createdAt: createTimestamp(),
            updatedAt: createTimestamp(),
          };

          allThemes.push(theme);
          questId++;

          // Stop when we reach 200 quests
          if (allThemes.length >= 200) return;
        });
        if (allThemes.length >= 200) return;
      });
      if (allThemes.length >= 200) return;
    });
    if (allThemes.length >= 200) return;
  });

  return allThemes.slice(0, 200); // Ensure exactly 200 quests
};

// Export the generated quest data
export const questThemes = generateQuestThemes();

// Export categories for filtering
export const questCategoriesForFilter = Object.keys(questCategories);

// Export age groups for filtering
export const questAgeGroups = ageGroups.map((group) => group.label);

// Export difficulties for filtering
export const questDifficulties = difficulties;
