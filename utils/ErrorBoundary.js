import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, TYPE, SPACING, RADIUS } from '../ui/tokens';
import { Ionicons } from '@expo/vector-icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Ionicons name="warning-outline" size={64} color={COLORS.error || '#F44336'} />
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              The app encountered an unexpected error. Please try again or restart the app.
            </Text>
            
            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetails}>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorStack}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}
            
            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg || '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.l || 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    ...TYPE.largeTitle,
    fontSize: 24,
    marginTop: SPACING.l || 24,
    marginBottom: SPACING.m || 16,
    color: COLORS.text || '#000000',
    textAlign: 'center',
  },
  message: {
    ...TYPE.body,
    fontSize: 16,
    marginBottom: SPACING.l || 24,
    color: COLORS.subtle || '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorDetails: {
    maxHeight: 200,
    backgroundColor: '#F5F5F5',
    borderRadius: RADIUS.m || 8,
    padding: SPACING.m || 16,
    marginBottom: SPACING.l || 24,
    width: '100%',
  },
  errorText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#D32F2F',
    marginBottom: SPACING.s || 8,
  },
  errorStack: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#666666',
  },
  button: {
    backgroundColor: COLORS.primary || '#007AFF',
    paddingVertical: SPACING.m || 16,
    paddingHorizontal: SPACING.l || 24,
    borderRadius: RADIUS.m || 8,
    minWidth: 150,
  },
  buttonText: {
    ...TYPE.bodyStrong,
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default ErrorBoundary;
