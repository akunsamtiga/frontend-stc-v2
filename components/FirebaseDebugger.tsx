'use client'

import { useState } from 'react'
import { testFirebaseConnection, debugListPaths, fetchHistoricalData, getLatestBar } from '@/lib/firebase'
import { Bug, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function FirebaseDebugger() {
  const [isOpen, setIsOpen] = useState(false)
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const addResult = (message: string, type: 'success' | 'error' | 'info') => {
    setResults(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }])
  }

  const runTests = async () => {
    setTesting(true)
    setResults([])

    try {
      // Test 1: Connection
      addResult('Testing Firebase connection...', 'info')
      const connected = await testFirebaseConnection()
      addResult(
        connected ? '✅ Firebase connected' : '❌ Firebase connection failed',
        connected ? 'success' : 'error'
      )

      if (!connected) {
        setTesting(false)
        return
      }

      // Test 2: List root paths
      addResult('Listing root paths...', 'info')
      await debugListPaths('/')
      addResult('Check console for path list', 'info')

      // Test 3: Check idx_stc path
      addResult('Checking /idx_stc path...', 'info')
      await debugListPaths('/idx_stc')
      addResult('Check console for idx_stc structure', 'info')

      // Test 4: Fetch 1m data
      addResult('Fetching 1m OHLC data...', 'info')
      const data1m = await fetchHistoricalData('/idx_stc', '1m')
      addResult(
        data1m.length > 0 
          ? `✅ Got ${data1m.length} bars for 1m` 
          : '❌ No 1m data found',
        data1m.length > 0 ? 'success' : 'error'
      )

      // Test 5: Get latest bar
      addResult('Getting latest 1m bar...', 'info')
      const latest = await getLatestBar('/idx_stc', '1m')
      addResult(
        latest 
          ? `✅ Latest bar: ${latest.close} @ ${latest.datetime}` 
          : '❌ No latest bar found',
        latest ? 'success' : 'error'
      )

      addResult('🎉 All tests completed!', 'success')

    } catch (error: any) {
      addResult(`❌ Test error: ${error.message}`, 'error')
    } finally {
      setTesting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center shadow-lg z-50"
        title="Firebase Debugger"
      >
        <Bug className="w-5 h-5 text-white" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-[#0f1419] border border-gray-800 rounded-lg shadow-2xl z-50 max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold">Firebase Debugger</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <button
          onClick={runTests}
          disabled={testing}
          className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors mb-4 flex items-center justify-center gap-2"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run Firebase Tests'
          )}
        </button>

        {results.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-gray-400 mb-2">Test Results:</div>
            {results.map((result, i) => (
              <div
                key={i}
                className={`text-xs p-2 rounded ${
                  result.type === 'success'
                    ? 'bg-green-500/10 text-green-400'
                    : result.type === 'error'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-blue-500/10 text-blue-400'
                }`}
              >
                <div className="flex items-start gap-2">
                  {result.type === 'success' && <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                  {result.type === 'error' && <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="break-words">{result.message}</div>
                    <div className="text-[10px] opacity-60 mt-1">{result.timestamp}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800 text-xs text-gray-500">
        💡 Check browser console (F12) for detailed logs
      </div>
    </div>
  )
}