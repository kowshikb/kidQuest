import React, { createContext, useContext, ReactNode } from 'react';
import { useQuests } from '../hooks/useQuests';
import { QuestTheme, UserQuestProgress } from '../api/questsApi';

interface QuestContextType {
  // Data
  themes: QuestTheme[];
  userProgress: UserQuestProgress | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  // Actions
  refreshQuests: () => Promise<void>;
  completeTask: (taskId: string, themeId: string, coinsEarned: number, completionData?: any) => Promise<boolean>;
  
  // Helpers
  isTaskCompleted: (taskId: string) => boolean;
  canStartTask: (taskId: string, prerequisites?: string[]) => boolean;
  getThemeProgress: (themeId: string) => { completed: number; total: number; percentage: number };
  
  // Filtering
  filterThemes: (category?: string | null, difficulty?: string | null, searchTerm?: string | null) => QuestTheme[];
  
  // State
  retryCount: number;
}

const QuestContext = createContext<QuestContextType | undefined>(undefined);

export function useQuestContext() {
  const context = useContext(QuestContext);
  if (context === undefined) {
    throw new Error('useQuestContext must be used within a QuestProvider');
  }
  return context;
}

interface QuestProviderProps {
  children: ReactNode;
  category?: string;
  difficulty?: string;
  enableRealTimeUpdates?: boolean;
}

export const QuestProvider: React.FC<QuestProviderProps> = ({ 
  children, 
  category,
  difficulty,
  enableRealTimeUpdates = true 
}) => {
  const questHook = useQuests({
    category,
    difficulty,
    includeInactive: false,
    enableRealTimeUpdates
  });

  // Filter themes based on search criteria
  const filterThemes = (
    filterCategory?: string | null,
    filterDifficulty?: string | null,
    searchTerm?: string | null
  ): QuestTheme[] => {
    let filtered = [...questHook.themes];
    
    if (filterCategory) {
      filtered = filtered.filter(theme => theme.category === filterCategory);
    }
    
    if (filterDifficulty) {
      filtered = filtered.filter(theme => theme.difficulty === filterDifficulty);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(theme => 
        theme.name.toLowerCase().includes(term) || 
        theme.description.toLowerCase().includes(term) ||
        theme.category.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  const value: QuestContextType = {
    ...questHook,
    filterThemes
  };

  return (
    <QuestContext.Provider value={value}>
      {children}
    </QuestContext.Provider>
  );
};

export default QuestProvider;