import { fetchBooks, logout, removeAllLocalBooks, scanServerFiles } from '@/data/api/api';
import { resetDb } from '@/data/database/utils';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { deleteAllRows, upsertAudiobooks } from '@/data/database/audiobook-repo';

export default function MenuTab() {
  const [isOnline, setIsOnline] = useState(true); // Track online/offline state

  const handleSyncDatabase = async () => {
    Alert.alert(
      "Sync Database",
      "Scan for new audiobook files?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sync",
          onPress: async () => {
            await scanServerFiles()
            const books = await fetchBooks()
            await upsertAudiobooks(books.books)
          }
        }
      ]
    );
  };

  const handleToggleOnlineMode = async () => {
    if (isOnline) {
      // Going offline
      Alert.alert(
        "Go Offline",
        "Disconnect from server?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go Offline",
            onPress: () => {
              setIsOnline(false);
              // TODO: Implement offline logic
              console.log("Going offline...");
            }
          }
        ]
      );
    } else {
      // Connecting to server
      try {
        // TODO: Implement server connection logic
        console.log("Connecting to server...");
        setIsOnline(true);
      } catch (error) {
        Alert.alert("Connection Failed", "Unable to connect to server");
      }
    }
  };

  const handleShowLocalFiles = () => {
    // TODO: Navigate to local files view or show modal
    console.log("Showing local files...");
  };

  const handleDeleteDownloads = () => {
    Alert.alert(
      "Delete Downloads",
      "Remove all downloaded audiobook files? This will not affect your library data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await removeAllLocalBooks()
          }
        }
      ]
    );
  };

  const handleResetDatabase = () => {
    Alert.alert(
      "Reset Database",
      "This will delete all data and reset the app. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetDb();
            // await deleteAllRows();
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await logout(router);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Sync & Connection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync & Connection</Text>

          <MenuItem
            icon="sync"
            title="Sync Database"
            subtitle="Scan for new audiobook files"
            onPress={handleSyncDatabase}
          />

          <MenuItem
            icon={isOnline ? "cloud-off" : "cloud-queue"}
            title={isOnline ? "Go Offline" : "Connect to Server"}
            subtitle={isOnline ? "Disconnect from server" : "Reconnect to server"}
            onPress={handleToggleOnlineMode}
            iconColor={isOnline ? "#4CAF50" : "#FFA726"}
          />
        </View>

        {/* Library Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Library</Text>

          <MenuItem
            icon="folder"
            title="Show Local Files"
            subtitle="Browse downloaded audiobooks"
            onPress={handleShowLocalFiles}
          />
        </View>

        {/* Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>

          <MenuItem
            icon="delete-sweep"
            title="Delete Downloads"
            subtitle="Remove downloaded files only"
            onPress={handleDeleteDownloads}
            iconColor="#FF9800"
          />

          <MenuItem
            icon="restore"
            title="Reset Database"
            subtitle="Delete all data and start fresh"
            onPress={handleResetDatabase}
            iconColor="#F44336"
          />
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <MenuItem
            icon="logout"
            title="Log Out"
            subtitle="Sign out of your account"
            onPress={handleLogout}
            iconColor="#F44336"
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

function MenuItem({ icon, title, subtitle, onPress, iconColor = "#FFF" }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemIcon}>
        <MaterialIcons name={icon} size={28} color={iconColor} />
      </View>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemTitle}>{title}</Text>
        <Text style={styles.menuItemSubtitle}>{subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#666" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  titleText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: "#999",
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  menuItemIcon: {
    width: 40,
    alignItems: 'center',
  },
  menuItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuItemTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuItemSubtitle: {
    color: "#999",
    fontSize: 13,
  },
  bottomSpacer: {
    height: 32,
  },
});
