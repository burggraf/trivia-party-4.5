import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * ErrorBoundary Component (T054)
 *
 * Catches React errors in the component tree below it
 * Displays a user-friendly error message
 * Logs errors to console for debugging
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    // Reset error state and reload the page
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
    window.location.href = '/'
  }

  handleReload = () => {
    // Reload the current page
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription>
                We encountered an unexpected error. Please try reloading the page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <strong>Error:</strong> {this.state.error.toString()}
                  </AlertDescription>
                </Alert>
              )}

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium mb-2">
                    Error Details (Development Only)
                  </summary>
                  <pre className="overflow-auto p-4 bg-muted rounded-lg text-xs">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3">
                <Button onClick={this.handleReload} className="flex-1">
                  Reload Page
                </Button>
                <Button onClick={this.handleReset} variant="outline" className="flex-1">
                  Go to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
