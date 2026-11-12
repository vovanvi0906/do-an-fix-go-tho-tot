/**
 * @file GlobalErrorBoundary.tsx
 * @description Component Bọc Bắt Lỗi UI Toàn Cầu (Global Error Boundary).
 * Ngăn chặn hoàn toàn hiện tượng màn hình trắng (White Screen of Death),
 * tự động gửi log lỗi về Backend và hiển thị giao diện khôi phục trực quan.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendErrorToLog } from '../utils/remoteLogger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    // Tự động gửi log về Backend để lưu vào logs/mobile.log
    sendErrorToLog(
      {
        message: error.message,
        stack: `${error.stack || ''}\nComponentStack:\n${errorInfo.componentStack || ''}`,
      },
      'REACT_ERROR_BOUNDARY',
      'error'
    );
  }

  handleReload = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Lỗi không xác định';
      const stackTrace =
        this.state.error?.stack || this.state.errorInfo?.componentStack || '';

      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Error Icon & Header */}
            <View style={styles.iconCircle}>
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
            </View>

            <Text style={styles.title}>Đã xảy ra sự cố</Text>
            <Text style={styles.subtitle}>
              Ứng dụng đã tự động ghi nhận lỗi và chuyển tới đội ngũ kỹ thuật.
            </Text>

            {/* Error Message Box */}
            <View style={styles.errorBox}>
              <Text style={styles.errorLabel}>Mô tả lỗi:</Text>
              <Text style={styles.errorText} numberOfLines={3}>
                {errorMessage}
              </Text>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={styles.reloadButton}
              activeOpacity={0.8}
              onPress={this.handleReload}
            >
              <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.reloadButtonText}>Thử tải lại giao diện</Text>
            </TouchableOpacity>

            {/* Developer Details Toggle */}
            <TouchableOpacity
              style={styles.detailsToggle}
              activeOpacity={0.7}
              onPress={this.toggleDetails}
            >
              <Text style={styles.detailsToggleText}>
                {this.state.showDetails ? 'Ẩn chi tiết kỹ thuật ▲' : 'Xem chi tiết kỹ thuật ▼'}
              </Text>
            </TouchableOpacity>

            {this.state.showDetails && (
              <View style={styles.stackBox}>
                <Text style={styles.stackTitle}>Stack Trace:</Text>
                <ScrollView horizontal nestedScrollEnabled>
                  <Text style={styles.stackText}>{stackTrace || 'Không có stack trace'}</Text>
                </ScrollView>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 320,
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
    marginBottom: 20,
  },
  errorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  errorText: {
    fontSize: 13,
    color: '#334155',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 14,
    width: '100%',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  reloadButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailsToggle: {
    marginTop: 16,
    paddingVertical: 8,
  },
  detailsToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  stackBox: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  stackTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
  },
  stackText: {
    fontSize: 11,
    color: '#F8FAFC',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});

export default GlobalErrorBoundary;
