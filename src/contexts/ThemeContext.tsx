import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db, getBasePath } from '../firebase/config';
import { useModal } from './ModalContext';
import { useAuth } from './AuthContext';

export interface Task {
  id: string;
  description: string;
  coinReward: number;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'Life Skills' | 'Academics' | 'Social-Emotional' | 'Creative Arts' | 'Science' | 'Community' | 'Health';
  tasks: Task[];
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState({
    category: null as string | null,
    difficulty: null as string | null,
    searchTerm: null as string | null,
  });
  const { showModal } = useModal();
  const { currentUser } = useAuth();

  // Fetch themes from Firestore only when user is authenticated
  useEffect(() => {
    const fetchThemes = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const themesRef = collection(db, `${getBasePath()}/themes`);
        const themesQuery = query(themesRef);
        const querySnapshot = await getDocs(themesQuery);
        
        const themesData: Theme[] = [];
        querySnapshot.forEach((doc) => {
          themesData.push({ id: doc.id, ...doc.data() } as Theme);
        });
        
        setThemes(themesData);
        setFilteredThemes(themesData);
      } catch (err) {
        console.error("Error fetching themes:", err);
        setError("Failed to load themes");
        showModal({
          title: "Magical Library Error",
          message: "We couldn't fetch the quest themes. Let's try again soon!",
          type: "error"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchThemes();
  }, [currentUser, showModal]);

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

  // If we don't have themes from the database yet, provide mock themes for development
  useEffect(() => {
    if (!loading && themes.length === 0 && !error && currentUser) {
      const mockThemes: Theme[] = [
        {
          id: "theme1",
          name: "Emotional Intelligence",
          description: "Learn to understand and manage your feelings",
          difficulty: "Easy",
          category: "Social-Emotional",
          tasks: [
            { id: "task1", description: "Draw a picture of how you feel today", coinReward: 5 },
            { id: "task2", description: "Name three things that make you happy", coinReward: 10 },
            { id: "task3", description: "Practice deep breathing when you feel upset", coinReward: 15 }
          ]
        },
        {
          id: "theme2",
          name: "Environmental Stewardship",
          description: "Discover ways to protect our planet",
          difficulty: "Medium",
          category: "Science",
          tasks: [
            { id: "task4", description: "Sort recyclables correctly for one week", coinReward: 20 },
            { id: "task5", description: "Plant a seed and watch it grow", coinReward: 25 },
            { id: "task6", description: "Use less water when brushing teeth", coinReward: 15 }
          ]
        },
        {
          id: "theme3",
          name: "Critical Thinking",
          description: "Sharpen your problem-solving skills",
          difficulty: "Hard",
          category: "Academics",
          tasks: [
            { id: "task7", description: "Solve a puzzle without help", coinReward: 30 },
            { id: "task8", description: "Create your own board game", coinReward: 40 },
            { id: "task9", description: "Find three ways to improve something at home", coinReward: 35 }
          ]
        }
      ];
      
      setThemes(mockThemes);
      setFilteredThemes(mockThemes);
    }
  }, [loading, themes.length, error, currentUser]);

  const value = {
    themes,
    loading,
    error,
    filteredThemes,
    filterThemes,
    activeFilters
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};