import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, RefreshControl, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { getLeaderboard, getUserScore, getUserInfo, LeaderboardEntry } from '@/util/leaderboardData';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SafeAreaView } from "react-native-safe-area-context";
import { getDeviceIdentifier } from '@/util/deviceIdentifier';
import { generateSeededName } from '@/util/randomNames';

export default function LeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userScore, setUserScore] = useState(0);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const n = 3;

  const loadLeaderboard = async () => {
    try {
      const data = await getLeaderboard();
      const score = await getUserScore();
      
      // Get user's specific info from API
      const deviceId = await getDeviceIdentifier();
      const userName = generateSeededName(deviceId);
      const userInfo = await getUserInfo(userName);
      
      setLeaderboard(data);
      setUserScore(score);
      setUserEntry(userInfo);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const getRankColor = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) {
      return colorScheme === 'dark' ? '#4A9EFF' : '#0066CC';
    }
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return colorScheme === 'dark' ? '#666' : '#999';
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.loadingText}>Loading leaderboard...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{flex: 1}}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <IconSymbol
            size={40}
            color={colorScheme === 'dark' ? '#FFD700' : '#FF9500'}
            name="trophy.fill"
            style={styles.headerIcon}
        />
        <ThemedText style={[styles.title, { fontFamily: Fonts.rounded }]}>
            Leaderboard
        </ThemedText>
        </View>

        {/* User Score Card */}
        <ThemedView style={[
          styles.userScoreCard,
          { backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7' }
          ]}>
          <ThemedText style={styles.userScoreLabel}>Your Score </ThemedText>
          <ThemedText style={[styles.userScoreValue, { fontFamily: Fonts.rounded }]}>
              {userScore.toLocaleString()}
          </ThemedText>
        </ThemedView>

        {/* Leaderboard List */}
        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        >
        {/* Top 2 entries */}
        {leaderboard.slice(0, n).map((entry, index) => {
            const isCurrentUser = entry.isCurrentUser || false;
            
            return (
            <ThemedView
                key={index}
                style={[
                styles.leaderboardItem,
                isCurrentUser && styles.currentUserItem,
                {
                    backgroundColor: isCurrentUser
                    ? colorScheme === 'dark' ? '#1C2D3F' : '#E3F2FD'
                    : colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
                    borderColor: isCurrentUser
                    ? colorScheme === 'dark' ? '#4A9EFF' : '#0066CC'
                    : colorScheme === 'dark' ? '#2C2C2E' : '#E5E5EA',
                }
                ]}
            >
                {/* Rank */}
                <View style={styles.rankContainer}>
                <ThemedText
                    style={[
                    styles.rank,
                    { color: getRankColor(entry.rank, isCurrentUser) },
                    entry.rank <= 3 && styles.topRank,
                    ]}
                >
                    {getRankEmoji(entry.rank)}
                </ThemedText>
                </View>

                {/* Name */}
                <View style={styles.nameContainer}>
                <ThemedText
                    style={[
                    styles.name,
                    isCurrentUser && styles.currentUserName,
                    { fontFamily: Fonts.rounded },
                    ]}
                    numberOfLines={1}
                >
                    {entry.name}
                </ThemedText>
                {isCurrentUser && (
                    <ThemedText style={styles.youLabel}>(You)</ThemedText>
                )}
                </View>

                {/* Score */}
                <ThemedText
                style={[
                    styles.score,
                    isCurrentUser && styles.currentUserScore,
                    { fontFamily: Fonts.rounded },
                ]}
                >
                {entry.score.toLocaleString()}
                </ThemedText>
            </ThemedView>
            );
        })}

        {/* Separator - only show if user is not in top n */}
        {userEntry && userEntry.rank > n && (
          <View style={styles.separatorContainer}>
            <View style={[styles.separatorLine, { 
              backgroundColor: colorScheme === 'dark' ? '#3C3C3E' : '#C7C7CC' 
            }]} />
            <ThemedText style={[styles.separatorText, {
              color: colorScheme === 'dark' ? '#8E8E93' : '#8E8E93'
            }]}>
              • • •
            </ThemedText>
            <View style={[styles.separatorLine, { 
              backgroundColor: colorScheme === 'dark' ? '#3C3C3E' : '#C7C7CC' 
            }]} />
          </View>
        )}

        {/* User's entry - only show if not in top n */}
        {userEntry && userEntry.rank > n && (
          <ThemedView
            style={[
              styles.leaderboardItem,
              styles.currentUserItem,
              {
                backgroundColor: colorScheme === 'dark' ? '#1C2D3F' : '#E3F2FD',
                borderColor: colorScheme === 'dark' ? '#4A9EFF' : '#0066CC',
              }
            ]}
          >
            {/* Rank */}
            <View style={styles.rankContainer}>
              <ThemedText
                style={[
                  styles.rank,
                  { color: getRankColor(userEntry.rank, true) },
                ]}
              >
                {getRankEmoji(userEntry.rank)}
              </ThemedText>
            </View>

            {/* Name */}
            <View style={styles.nameContainer}>
              <ThemedText
                style={[
                  styles.name,
                  styles.currentUserName,
                  { fontFamily: Fonts.rounded },
                ]}
                numberOfLines={1}
              >
                {userEntry.name}
              </ThemedText>
              <ThemedText style={styles.youLabel}>(You)</ThemedText>
            </View>

            {/* Score */}
            <ThemedText
              style={[
                styles.score,
                styles.currentUserScore,
                { fontFamily: Fonts.rounded },
              ]}
            >
              {userEntry.score.toLocaleString()}
            </ThemedText>
          </ThemedView>
        )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 12,
    
  },
  headerIcon: {
    marginTop: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 58
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
  },
  userScoreCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 8,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userScoreLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  userScoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 58
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  currentUserItem: {
    borderWidth: 2,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rank: {
    fontSize: 18,
    fontWeight: '600',
  },
  topRank: {
    fontSize: 24,
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  currentUserName: {
    fontWeight: '700',
  },
  youLabel: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  score: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'right',
  },
  currentUserScore: {
    fontWeight: '800',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
  },
  separatorText: {
    fontSize: 16,
    marginHorizontal: 12,
    opacity: 0.5,
  },
});
