import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useQuests } from "./useQuests";
import { useFriends } from "./useFriends";
import { hobbiesApi, Hobby, UserHobbyProgress } from "../api/hobbiesApi";

export interface AppStats {
  // Magic Coins
  totalMagicCoins: number;
  coinsFromQuests: number;
  coinsFromHobbies: number;

  // Quests
  totalQuests: number;
  availableQuests: number;
  completedQuests: number;
  questTasksCompleted: number;
  totalQuestTasks: number;

  // Hobbies
  totalHobbies: number;
  availableHobbies: number;
  completedHobbies: number;
  hobbyTasksCompleted: number;
  totalHobbyTasks: number;

  // Friends
  totalFriends: number;

  // Overall Tasks
  totalTasksCompleted: number;
  totalTasksAvailable: number;

  // Loading states
  loading: {
    auth: boolean;
    quests: boolean;
    hobbies: boolean;
    friends: boolean;
    overall: boolean;
  };

  // Errors
  error: string | null;

  // Refresh function
  refresh: () => Promise<void>;
}

export const useAppStats = (): AppStats => {
  const { userProfile, loading: authLoading } = useAuth();
  const {
    themes: questThemes,
    userProgress: questProgress,
    loading: questsLoading,
    error: questsError,
    refreshQuests,
  } = useQuests();
  const { friendsCount, loading: friendsLoading } = useFriends();

  const [hobbiesLoading, setHobbiesLoading] = useState(true);
  const [allHobbies, setAllHobbies] = useState<Hobby[]>([]);
  const [hobbyProgress, setHobbyProgress] = useState<UserHobbyProgress[]>([]);
  const [hobbiesError, setHobbiesError] = useState<string | null>(null);

  // Fetch hobbies data
  const fetchHobbiesData = useCallback(async () => {
    if (!userProfile?.userId) {
      setHobbiesLoading(false);
      return;
    }

    try {
      setHobbiesLoading(true);
      setHobbiesError(null);

      const [hobbiesResponse, progressResponse] = await Promise.all([
        hobbiesApi.getHobbies({
          userId: userProfile.userId,
          userAge: userProfile.age,
        }),
        hobbiesApi.getUserHobbyProgress(userProfile.userId),
      ]);

      if (hobbiesResponse.success) {
        setAllHobbies(hobbiesResponse.data || []);
      } else {
        setHobbiesError(hobbiesResponse.message || "Failed to fetch hobbies");
      }

      if (progressResponse.success) {
        setHobbyProgress(progressResponse.data || []);
      } else {
        console.warn(
          "Failed to fetch hobby progress:",
          progressResponse.message
        );
      }
    } catch (error) {
      console.error("Error fetching hobbies data:", error);
      setHobbiesError("Failed to load hobby stats");
    } finally {
      setHobbiesLoading(false);
    }
  }, [userProfile?.userId, userProfile?.age]);

  useEffect(() => {
    fetchHobbiesData();
  }, [fetchHobbiesData]);

  // Quest statistics - always return actual numbers
  const questStats = useMemo(() => {
    if (!questThemes || !questProgress) {
      return {
        totalQuests: 0,
        completedQuests: 0,
        questTasksCompleted: 0,
        totalQuestTasks: 0,
        coinsFromQuests: 0,
      };
    }

    const totalQuestTasks = questThemes.reduce(
      (sum, theme) => sum + (theme.tasks?.length || 0),
      0
    );

    const completedQuests = questThemes.filter((theme) => {
      if (!theme.tasks || theme.tasks.length === 0) return false;
      return theme.tasks.every((task) =>
        questProgress.completedTasks.includes(task.id)
      );
    }).length;

    const coinsFromQuests = questThemes
      .flatMap((theme) => theme.tasks || [])
      .filter((task) => questProgress.completedTasks.includes(task.id))
      .reduce((sum, task) => sum + (task.coinReward || 0), 0);

    return {
      totalQuests: questThemes.length,
      completedQuests,
      questTasksCompleted: questProgress.completedTasks?.length || 0,
      totalQuestTasks,
      coinsFromQuests,
    };
  }, [questThemes, questProgress]);

  // Hobbies statistics - always return actual numbers
  const hobbiesStats = useMemo(() => {
    if (!allHobbies.length) {
      return {
        totalHobbies: 0,
        completedHobbies: 0,
        hobbyTasksCompleted: 0,
        totalHobbyTasks: 0,
        coinsFromHobbies: 0,
      };
    }

    const totalHobbyTasks = allHobbies.reduce(
      (sum, hobby) =>
        sum +
        hobby.levels.reduce(
          (levelSum, level) => levelSum + level.tasks.length,
          0
        ),
      0
    );

    const hobbyTasksCompleted = hobbyProgress.reduce(
      (sum, p) => sum + p.completedTasks.length,
      0
    );

    const completedHobbies = allHobbies.filter((hobby) => {
      const hobbyTotalTasks = hobby.levels.reduce(
        (sum, level) => sum + level.tasks.length,
        0
      );
      if (hobbyTotalTasks === 0) return false;
      const progress = hobbyProgress.find((p) => p.hobbyId === hobby.id);
      return progress && progress.completedTasks.length >= hobbyTotalTasks;
    }).length;

    const coinsFromHobbies = allHobbies.reduce((totalCoins, hobby) => {
      const progress = hobbyProgress.find((p) => p.hobbyId === hobby.id);
      if (!progress) return totalCoins;

      const earnedCoins = hobby.levels
        .flatMap((level) => level.tasks)
        .filter((task) => progress.completedTasks.includes(task.id))
        .reduce((sum, task) => sum + (task.coinReward || 0), 0);

      return totalCoins + earnedCoins;
    }, 0);

    return {
      totalHobbies: allHobbies.length,
      completedHobbies,
      hobbyTasksCompleted,
      totalHobbyTasks,
      coinsFromHobbies,
    };
  }, [allHobbies, hobbyProgress]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const totalTasksCompleted =
      questStats.questTasksCompleted + hobbiesStats.hobbyTasksCompleted;
    const totalTasksAvailable =
      questStats.totalQuestTasks + hobbiesStats.totalHobbyTasks;
    const availableQuests = Math.max(
      0,
      questStats.totalQuests - questStats.completedQuests
    );
    const availableHobbies = Math.max(
      0,
      hobbiesStats.totalHobbies - hobbiesStats.completedHobbies
    );

    return {
      totalTasksCompleted,
      totalTasksAvailable,
      availableQuests,
      availableHobbies,
    };
  }, [questStats, hobbiesStats]);

  // Loading states
  const loading = {
    auth: authLoading,
    quests: questsLoading,
    hobbies: hobbiesLoading,
    friends: friendsLoading,
    overall: authLoading || questsLoading || hobbiesLoading || friendsLoading,
  };

  const error = questsError || hobbiesError;

  // Refresh function
  const refresh = useCallback(async () => {
    console.log("🔄 Refreshing all app stats...");
    try {
      await Promise.all([refreshQuests(), fetchHobbiesData()]);
      console.log("✅ App stats refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing app stats:", error);
    }
  }, [refreshQuests, fetchHobbiesData]);

  return {
    // Magic Coins
    totalMagicCoins: userProfile?.coins ?? 0,
    coinsFromQuests: questStats.coinsFromQuests,
    coinsFromHobbies: hobbiesStats.coinsFromHobbies,

    // Quests
    totalQuests: questStats.totalQuests,
    availableQuests: overallStats.availableQuests,
    completedQuests: questStats.completedQuests,
    questTasksCompleted: questStats.questTasksCompleted,
    totalQuestTasks: questStats.totalQuestTasks,

    // Hobbies
    totalHobbies: hobbiesStats.totalHobbies,
    availableHobbies: overallStats.availableHobbies,
    completedHobbies: hobbiesStats.completedHobbies,
    hobbyTasksCompleted: hobbiesStats.hobbyTasksCompleted,
    totalHobbyTasks: hobbiesStats.totalHobbyTasks,

    // Friends
    totalFriends: friendsCount ?? 0,

    // Overall Tasks
    totalTasksCompleted: overallStats.totalTasksCompleted,
    totalTasksAvailable: overallStats.totalTasksAvailable,

    // Loading states
    loading,

    // Errors
    error,

    // Refresh function
    refresh,
  };
};
