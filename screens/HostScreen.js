import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar } from 'react-native';

export default function HostScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Host</Text>
        <Text style={styles.subtitle}>Add cars and services</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Host content will go here</Text>
          <Text style={styles.placeholderSubtext}>Add cars and services to your fleet</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Nunito-Bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#666666',
    marginBottom: 24,
  },
  placeholder: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#999999',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#999999',
  },
});
