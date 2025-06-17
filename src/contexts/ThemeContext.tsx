import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db, getBasePath } from "../firebase/config";
import { useModal } from "./ModalContext";

export interface Task {
  id: string;
  title: string;
  description: string;
  coins: number;
  coinReward: number;
  type: string;
  data?: any;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category:
    | "Life Skills"
    | "Academics"
    | "Social-Emotional"
    | "Creative Arts"
    | "Science"
    | "Community"
    | "Health"
    | "Education"
    | "Math"
    | "Language"
    | "Art";
  tasks: Task[];
  imageUrl?: string;
  isActive?: boolean;
  order?: number;
}

interface ThemeContextType {
  themes: Theme[];
  loading: boolean;
  error: string | null;
  filteredThemes: Theme[];
  filterThemes: (
    category?: string | null,
    difficulty?: string | null,
    searchTerm?: string | null
  ) => void;
  activeFilters: {
    category: string | null;
    difficulty: string | null;
    searchTerm: string | null;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [filteredThemes, setFilteredThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState({
    category: null as string | null,
    difficulty: null as string | null,
    searchTerm: null as string | null,
  });
  const { showModal } = useModal();

  // Load themes from backend when provider mounts
  useEffect(() => {
    console.log("ThemeProvider mounted, attempting to load from backend first");
    // Try to load from backend first, fallback to mock if needed
    const loadThemes = async () => {
      try {
        // For now, we'll use mock themes since backend might not be fully set up
        // TODO: Switch to fetchThemesFromDatabase when backend is ready
        loadMockThemes();
      } catch (error) {
        console.error("Failed to load themes:", error);
        loadMockThemes();
      }
    };
    loadThemes();
  }, []);

  // Load comprehensive mock themes for immediate display
  const loadMockThemes = () => {
    console.log("Loading comprehensive mock themes...");
    const mockThemes: Theme[] = [
      {
        id: "theme1",
        name: "Math Magic Academy",
        description: "Master magical mathematics and number spells!",
        difficulty: "Easy",
        category: "Math",
        imageUrl:
          "https://images.pexels.com/photos/3771074/pexels-photo-3771074.jpeg?auto=compress&cs=tinysrgb&w=400",
        isActive: true,
        order: 1,
        tasks: [
          {
            id: "math_001",
            title: "Addition Spells",
            description: "Learn to cast addition spells with numbers 1-10",
            coins: 50,
            coinReward: 50,
            type: "quiz",
            data: {
              questions: [
                {
                  question: "What is 3 + 4?",
                  answer: "7",
                  options: ["6", "7", "8", "9"],
                },
                {
                  question: "What is 5 + 2?",
                  answer: "7",
                  options: ["6", "7", "8", "9"],
                },
                {
                  question: "What is 8 + 1?",
                  answer: "9",
                  options: ["7", "8", "9", "10"],
                },
              ],
            },
          },
          {
            id: "math_002",
            title: "Subtraction Sorcery",
            description: "Master the art of subtraction magic",
            coins: 60,
            coinReward: 60,
            type: "quiz",
            data: {
              questions: [
                {
                  question: "What is 10 - 3?",
                  answer: "7",
                  options: ["6", "7", "8", "9"],
                },
                {
                  question: "What is 9 - 4?",
                  answer: "5",
                  options: ["4", "5", "6", "7"],
                },
              ],
            },
          },
          {
            id: "math_003",
            title: "Multiplication Mastery",
            description: "Unlock the secrets of multiplication",
            coins: 75,
            coinReward: 75,
            type: "quiz",
            data: {
              questions: [
                {
                  question: "What is 3 × 4?",
                  answer: "12",
                  options: ["10", "11", "12", "13"],
                },
              ],
            },
          },
          {
            id: "math_004",
            title: "Division Discovery",
            description: "Explore the magic of division",
            coins: 80,
            coinReward: 80,
            type: "quiz",
          },
        ],
      },
      {
        id: "theme2",
        name: "Science Quest Laboratory",
        description:
          "Explore the wonders of science through magical experiments!",
        difficulty: "Medium",
        category: "Science",
        imageUrl:
          "https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg?auto=compress&cs=tinysrgb&w=400",
        isActive: true,
        order: 2,
        tasks: [
          {
            id: "science_001",
            title: "States of Matter Magic",
            description: "Discover the three states of matter",
            coins: 75,
            coinReward: 75,
            type: "quiz",
            data: {
              questions: [
                {
                  question: "What happens to ice when it gets warm?",
                  answer: "It melts",
                  options: [
                    "It melts",
                    "It freezes",
                    "It disappears",
                    "It grows",
                  ],
                },
                {
                  question: "What state is water vapor?",
                  answer: "Gas",
                  options: ["Solid", "Liquid", "Gas", "Plasma"],
                },
              ],
            },
          },
          {
            id: "science_002",
            title: "Animal Kingdom Adventure",
            description: "Learn about different animal habitats",
            coins: 80,
            coinReward: 80,
            type: "matching",
            data: {
              pairs: [
                { animal: "Fish", habitat: "Water" },
                { animal: "Bird", habitat: "Sky" },
                { animal: "Bear", habitat: "Forest" },
              ],
            },
          },
          {
            id: "science_003",
            title: "Weather Wizard",
            description: "Understand how weather patterns work",
            coins: 85,
            coinReward: 85,
            type: "activity",
          },
          {
            id: "science_004",
            title: "Plant Power",
            description: "Learn how plants grow and survive",
            coins: 70,
            coinReward: 70,
            type: "quiz",
          },
        ],
      },
      {
        id: "theme3",
        name: "Language Arts Castle",
        description:
          "Build your vocabulary and reading skills in the magical castle!",
        difficulty: "Easy",
        category: "Language",
        imageUrl:
          "https://images.pexels.com/photos/267669/pexels-photo-267669.jpeg?auto=compress&cs=tinysrgb&w=400",
        isActive: true,
        order: 3,
        tasks: [
          {
            id: "language_001",
            title: "Rhyme Time Spell",
            description: "Find words that rhyme together",
            coins: 45,
            coinReward: 45,
            type: "matching",
            data: {
              pairs: [
                { word1: "Cat", word2: "Hat" },
                { word1: "Dog", word2: "Log" },
                { word1: "Sun", word2: "Fun" },
              ],
            },
          },
          {
            id: "language_002",
            title: "Story Building Blocks",
            description:
              "Create magical stories with beginning, middle, and end",
            coins: 65,
            coinReward: 65,
            type: "creative",
            data: {
              prompt: "Write a short story about a magical adventure",
              minWords: 50,
            },
          },
          {
            id: "language_003",
            title: "Vocabulary Vault",
            description: "Expand your magical word collection",
            coins: 55,
            coinReward: 55,
            type: "quiz",
          },
          {
            id: "language_004",
            title: "Reading Comprehension Quest",
            description: "Master the art of understanding stories",
            coins: 60,
            coinReward: 60,
            type: "reading",
          },
        ],
      },
      {
        id: "theme4",
        name: "Art & Creativity Studio",
        description:
          "Express yourself through magical art and creative projects!",
        difficulty: "Easy",
        category: "Art",
        imageUrl:
          "https://images.pexels.com/photos/1037992/pexels-photo-1037992.jpeg?auto=compress&cs=tinysrgb&w=400",
        isActive: true,
        order: 4,
        tasks: [
          {
            id: "art_001",
            title: "Color Mixing Magic",
            description: "Learn what happens when you mix primary colors",
            coins: 55,
            coinReward: 55,
            type: "quiz",
            data: {
              questions: [
                {
                  question: "What color do you get when you mix red and blue?",
                  answer: "Purple",
                  options: ["Purple", "Green", "Orange", "Yellow"],
                },
                {
                  question:
                    "What color do you get when you mix yellow and blue?",
                  answer: "Green",
                  options: ["Purple", "Green", "Orange", "Pink"],
                },
              ],
            },
          },
          {
            id: "art_002",
            title: "Shape Recognition Quest",
            description: "Identify and draw different magical shapes",
            coins: 50,
            coinReward: 50,
            type: "drawing",
            data: {
              shapes: ["Circle", "Square", "Triangle", "Rectangle", "Star"],
            },
          },
          {
            id: "art_003",
            title: "Creative Expression",
            description: "Create your own magical artwork",
            coins: 70,
            coinReward: 70,
            type: "creative",
          },
          {
            id: "art_004",
            title: "Pattern Power",
            description: "Discover and create beautiful patterns",
            coins: 65,
            coinReward: 65,
            type: "activity",
          },
        ],
      },
      {
        id: "theme5",
        name: "Social Skills Academy",
        description: "Learn to work together and make friends!",
        difficulty: "Medium",
        category: "Social-Emotional",
        imageUrl:
          "https://images.pexels.com/photos/1181534/pexels-photo-1181534.jpeg?auto=compress&cs=tinysrgb&w=400",
        isActive: true,
        order: 5,
        tasks: [
          {
            id: "social_001",
            title: "Friendship Building",
            description: "Learn how to be a good friend",
            coins: 60,
            coinReward: 60,
            type: "activity",
          },
          {
            id: "social_002",
            title: "Teamwork Challenge",
            description: "Practice working together with others",
            coins: 70,
            coinReward: 70,
            type: "group",
          },
          {
            id: "social_003",
            title: "Kindness Quest",
            description: "Spread kindness and help others",
            coins: 65,
            coinReward: 65,
            type: "activity",
          },
        ],
      },
      {
        id: "theme6",
        name: "Life Skills Workshop",
        description: "Master important skills for everyday life!",
        difficulty: "Easy",
        category: "Life Skills",
        imageUrl:
          "https://images.pexels.com/photos/1181772/pexels-photo-1181772.jpeg?auto=compress&cs=tinysrgb&w=400",
        isActive: true,
        order: 6,
        tasks: [
          {
            id: "life_001",
            title: "Time Management Magic",
            description: "Learn to organize your time wisely",
            coins: 50,
            coinReward: 50,
            type: "activity",
          },
          {
            id: "life_002",
            title: "Money Matters",
            description: "Understand the basics of money and saving",
            coins: 75,
            coinReward: 75,
            type: "quiz",
          },
          {
            id: "life_003",
            title: "Healthy Habits",
            description: "Build good habits for a healthy life",
            coins: 55,
            coinReward: 55,
            type: "activity",
          },
        ],
      },
    ];

    console.log(
      "Mock themes loaded successfully:",
      mockThemes.length,
      "themes"
    );
    setThemes(mockThemes);
    setFilteredThemes(mockThemes);
    setError(null);
    setLoading(false);
  };

  // Fetch themes from Firestore (optional, as fallback)
  const fetchThemesFromDatabase = async (currentUser: any) => {
    if (!currentUser) {
      console.log("No user provided for database fetch");
      return;
    }

    try {
      setLoading(true);
      console.log("Attempting to fetch themes from Firestore...");

      const themesRef = collection(db, `${getBasePath()}/themes`);

      // Try to get themes with ordering
      let themesQuery;
      try {
        themesQuery = query(
          themesRef,
          where("isActive", "==", true),
          orderBy("order", "asc")
        );
      } catch (indexError) {
        console.warn("Index not available, using simple query:", indexError);
        themesQuery = query(themesRef);
      }

      const querySnapshot = await getDocs(themesQuery);
      console.log(`Found ${querySnapshot.docs.length} themes in database`);

      if (querySnapshot.docs.length > 0) {
        const themesData: Theme[] = [];
        querySnapshot.docs.forEach((doc) => {
          const data = doc.data();

          // Transform the data to match our interface
          const theme: Theme = {
            id: doc.id,
            name: data.name || "Unnamed Theme",
            description: data.description || "No description available",
            difficulty: data.difficulty || "Easy",
            category: data.category || "Education",
            imageUrl: data.imageUrl,
            isActive: data.isActive !== false,
            order: data.order || 0,
            tasks: (data.tasks || []).map((task: any) => ({
              id: task.id || `task_${Math.random()}`,
              title: task.title || task.description || "Untitled Task",
              description: task.description || "No description",
              coins: task.coins || task.coinReward || 10,
              coinReward: task.coinReward || task.coins || 10,
              type: task.type || "activity",
              data: task.data || {},
            })),
          };

          themesData.push(theme);
        });

        // Sort by order if available
        themesData.sort((a, b) => (a.order || 0) - (b.order || 0));

        console.log("Database themes loaded successfully:", themesData.length);
        setThemes(themesData);
        setFilteredThemes(themesData);
        setError(null);
      } else {
        console.log("No themes found in database, keeping mock themes");
      }
    } catch (err) {
      console.error("Error fetching themes from database:", err);
      console.log("Database fetch failed, keeping mock themes");

      // Don't show error modal for database issues, just keep using mock themes
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // Filter themes based on category, difficulty, and search term
  const filterThemes = (
    category: string | null = activeFilters.category,
    difficulty: string | null = activeFilters.difficulty,
    searchTerm: string | null = activeFilters.searchTerm
  ) => {
    let filtered = [...themes];

    if (category) {
      filtered = filtered.filter((theme) => theme.category === category);
    }

    if (difficulty) {
      filtered = filtered.filter((theme) => theme.difficulty === difficulty);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (theme) =>
          theme.name.toLowerCase().includes(term) ||
          theme.description.toLowerCase().includes(term)
      );
    }

    setFilteredThemes(filtered);
    setActiveFilters({ category, difficulty, searchTerm });
  };

  // Apply filters when themes change
  useEffect(() => {
    if (themes.length > 0) {
      filterThemes();
    }
  }, [themes]);

  const value: ThemeContextType = {
    themes,
    loading,
    error,
    filteredThemes,
    filterThemes,
    activeFilters,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
