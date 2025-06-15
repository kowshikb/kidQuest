import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, getBasePath } from '../firebase/config';
import { useModal } from './ModalContext';

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
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'Life Skills' | 'Academics' | 'Social-Emotional' | 'Creative Arts' | 'Science' | 'Community' | 'Health' | 'Education' | 'Math' | 'Language' | 'Art';
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
  fetchThemes: (currentUser: any) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
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

  // Fetch themes from Firestore
  const fetchThemes = async (currentUser: any) => {
    if (!currentUser) {
      console.log('No user provided, using mock themes');
      loadMockThemes();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching themes from Firestore...');

      const themesRef = collection(db, `${getBasePath()}/themes`);
      
      // Try to get themes with ordering
      let themesQuery;
      try {
        themesQuery = query(
          themesRef,
          where('isActive', '==', true),
          orderBy('order', 'asc')
        );
      } catch (indexError) {
        console.warn('Index not available, using simple query:', indexError);
        themesQuery = query(themesRef);
      }
      
      const querySnapshot = await getDocs(themesQuery);
      console.log(`Found ${querySnapshot.docs.length} themes`);
      
      const themesData: Theme[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Theme data:', data);
        
        // Transform the data to match our interface
        const theme: Theme = {
          id: doc.id,
          name: data.name || 'Unnamed Theme',
          description: data.description || 'No description available',
          difficulty: data.difficulty || 'Easy',
          category: data.category || 'Education',
          imageUrl: data.imageUrl,
          isActive: data.isActive !== false, // Default to true if not specified
          order: data.order || 0,
          tasks: (data.tasks || []).map((task: any) => ({
            id: task.id || `task_${Math.random()}`,
            title: task.title || task.description || 'Untitled Task',
            description: task.description || 'No description',
            coins: task.coins || task.coinReward || 10,
            coinReward: task.coinReward || task.coins || 10,
            type: task.type || 'activity',
            data: task.data || {}
          }))
        };
        
        themesData.push(theme);
      });
      
      // Sort by order if available
      themesData.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      console.log('Processed themes:', themesData);
      setThemes(themesData);
      setFilteredThemes(themesData);
      
      if (themesData.length === 0) {
        console.log('No themes found in database, loading mock themes');
        loadMockThemes();
      }
      
    } catch (err) {
      console.error("Error fetching themes:", err);
      setError("Failed to load themes");
      
      // Load mock themes as fallback
      console.log('Loading mock themes as fallback');
      loadMockThemes();
      
      // Only show modal if we have a user (avoid showing errors on logout)
      if (currentUser) {
        showModal({
          title: "Magical Library Error",
          message: "We couldn't fetch the quest themes from the database. Using sample themes for now!",
          type: "warning"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Load mock themes for development/fallback
  const loadMockThemes = () => {
    console.log('Loading mock themes...');
    const mockThemes: Theme[] = [
      {
        id: "theme1",
        name: "Math Magic Academy",
        description: "Master magical mathematics and number spells!",
        difficulty: "Easy",
        category: "Math",
        imageUrl: "https://images.pexels.com/photos/3771074/pexels-photo-3771074.jpeg?auto=compress&cs=tinysrgb&w=400",
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
              ],
            }
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
              ],
            }
          },
          { 
            id: "math_003", 
            title: "Multiplication Mastery",
            description: "Unlock the secrets of multiplication", 
            coins: 75,
            coinReward: 75,
            type: "quiz"
          }
        ]
      },
      {
        id: "theme2",
        name: "Science Quest Laboratory",
        description: "Explore the wonders of science through magical experiments!",
        difficulty: "Medium",
        category: "Science",
        imageUrl: "https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg?auto=compress&cs=tinysrgb&w=400",
        isActive: true,
        order: 2,
        tasks: [
          { 
            id: "science_001", 
            title: "States of Matter Magic",
            description: "Discover the three states of matter", 
            coins: 75,
            coinReward: 75,
            type: "quiz"
          },
          { 
            id: "science_002", 
            title: "Animal Kingdom Adventure",
            description: "Learn about different animal habitats", 
            coins: 80,
            coinReward: 80,
            type: "matching"
          },
          { 
            id: "science_003", 
            title: "Weather Wizard",
            description: "Understand how weather patterns work", 
            coins: 85,
            coinReward: 85,
            type: "activity"
          }
        ]
      },
      {
        id: "theme3",
        name: "Language Arts Castle",
        description: "Build your vocabulary and reading skills in the magical castle!",
        difficulty: "Easy",
        category: "Language",
        imageUrl: "https://images.pexels.com/photos/267669/pexels-photo-267669.jpeg?auto=compress&cs=tinysrgb&w=400",
        isActive: true,
        order: 3,
        tasks: [
          { 
            id: "language_001", 
            title: "Rhyme Time Spell",
            description: "Find words that rhyme together", 
            coins: 45,
            coinReward: 45,
            type: "matching"
          },
          { 
            id: "language_002", 
            title: "Story Building Blocks",
            description: "Create magical stories with beginning, middle, and end", 
            coins: 65,
            coinReward: 65,
            type: "creative"
          },
          { 
            id: "language_003", 
            title: "Vocabulary Vault",
            description: "Expand your magical word collection", 
            coins: 55,
            coinReward: 55,
            type: "quiz"
          }
        ]
      },
      {
        id: "theme4",
        name: "Art & Creativity Studio",
        description: "Express yourself through magical art and creative projects!",
        difficulty: "Easy",
        category: "Art",
        imageUrl: "https://images.pexels.com/photos/1037992/pexels-photo-1037992.jpeg?auto=compress&cs=tinysrgb&w=400",
        isActive: true,
        order: 4,
        tasks: [
          { 
            id: "art_001", 
            title: "Color Mixing Magic",
            description: "Learn what happens when you mix primary colors", 
            coins: 55,
            coinReward: 55,
            type: "quiz"
          },
          { 
            id: "art_002", 
            title: "Shape Recognition Quest",
            description: "Identify and draw different magical shapes", 
            coins: 50,
            coinReward: 50,
            type: "drawing"
          },
          { 
            id: "art_003", 
            title: "Creative Expression",
            description: "Create your own magical artwork", 
            coins: 70,
            coinReward: 70,
            type: "creative"
          }
        ]
      }
    ];
    
    console.log('Mock themes loaded:', mockThemes);
    setThemes(mockThemes);
    setFilteredThemes(mockThemes);
    setError(null);
  };

  // Filter themes based on category, difficulty, and search term
  const filterThemes = (
    category: string | null = activeFilters.category,
    difficulty: string | null = activeFilters.difficulty,
    searchTerm: string | null = activeFilters.searchTerm
  ) => {
    let filtered = [...themes];
    
    if (category) {
      filtered = filtered.filter(theme => theme.category === category);
    }
    
    if (difficulty) {
      filtered = filtered.filter(theme => theme.difficulty === difficulty);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(theme => 
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
    fetchThemes
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};