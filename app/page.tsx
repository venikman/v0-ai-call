"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Mic, Square, Volume2, Users, Clock, TrendingUp } from "lucide-react"

interface CoachingSuggestion {
  id: string
  type: "tone" | "pace" | "empathy" | "solution"
  message: string
  priority: "high" | "medium" | "low"
  timestamp: string
}

export default function CallCenterDashboard() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [coachingSuggestions, setCoachingSuggestions] = useState<CoachingSuggestion[]>([])
  const [currentPage, setCurrentPage] = useState<"live" | "post-call" | "fhir">("live")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Mock coaching suggestions for demo
  const mockSuggestions: CoachingSuggestion[] = [
    {
      id: "1",
      type: "tone",
      message: "Consider using a warmer tone to build rapport with the customer",
      priority: "medium",
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: "2",
      type: "pace",
      message: "Slow down slightly - customer may need time to process information",
      priority: "high",
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: "3",
      type: "empathy",
      message: "Great job acknowledging the customer's frustration",
      priority: "low",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]

  const startRecording = async () => {
    try {
      console.log("[v0] Starting recording...") // Added debug logging
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Setup audio context for level monitoring
      audioContextRef.current = new AudioContext()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      source.connect(analyserRef.current)

      // Setup media recorder
      mediaRecorderRef.current = new MediaRecorder(stream)
      mediaRecorderRef.current.start()

      setIsRecording(true)
      console.log("[v0] Recording state set to true") // Added debug logging
      setRecordingTime(0)

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)

        // Monitor audio levels
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(Math.min(100, (average / 255) * 100))
        }

        // Add mock coaching suggestions periodically
        if (Math.random() < 0.1) {
          // 10% chance each second
          const suggestion = mockSuggestions[Math.floor(Math.random() * mockSuggestions.length)]
          setCoachingSuggestions((prev) => [
            { ...suggestion, id: Date.now().toString(), timestamp: new Date().toLocaleTimeString() },
            ...prev.slice(0, 4), // Keep only 5 most recent
          ])
        }
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }

  const stopRecording = () => {
    console.log("[v0] stopRecording function called, current isRecording:", isRecording) // Enhanced debug logging

    if (mediaRecorderRef.current && isRecording) {
      console.log("[v0] Stopping media recorder...") // Added debug logging
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    setIsRecording(false)
    setAudioLevel(0)
    console.log("[v0] Recording stopped, state set to false") // Added debug logging
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground"
      case "medium":
        return "bg-secondary text-secondary-foreground"
      case "low":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tone":
        return "🎵"
      case "pace":
        return "⏱️"
      case "empathy":
        return "💝"
      case "solution":
        return "💡"
      default:
        return "💬"
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Call Center Coaching Dashboard</h1>
            <p className="text-muted-foreground mt-1">Real-time AI coaching for enhanced customer interactions</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {new Date().toLocaleTimeString()}
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Agent Dashboard
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant={currentPage === "live" ? "default" : "outline"} onClick={() => setCurrentPage("live")}>
            Live Call
          </Button>
          <Button
            variant={currentPage === "post-call" ? "default" : "outline"}
            onClick={() => setCurrentPage("post-call")}
          >
            Post-Call Analysis
          </Button>
          <Button variant={currentPage === "fhir" ? "default" : "outline"} onClick={() => setCurrentPage("fhir")}>
            FHIR Data View
          </Button>
        </div>
      </div>

      {currentPage === "live" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Audio Recording Panel */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-primary" />
                  Audio Controls
                </CardTitle>
                <CardDescription>Record and monitor your call audio in real-time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recording Button */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="flex items-center gap-4">
                      <Button
                        size="lg"
                        variant={isRecording ? "secondary" : "default"}
                        className="h-20 w-20 rounded-full"
                        onClick={startRecording}
                        disabled={isRecording}
                      >
                        <Mic className="h-8 w-8" />
                      </Button>

                      <Button
                        size="lg"
                        variant="destructive"
                        className={`h-20 w-20 rounded-full ${isRecording ? "animate-pulse" : ""}`}
                        onClick={stopRecording}
                        disabled={!isRecording}
                        style={{ pointerEvents: isRecording ? "auto" : "none" }} // Explicitly set pointer events
                      >
                        <Square className="h-8 w-8" />
                      </Button>
                    </div>
                    {isRecording && (
                      <div className="absolute -inset-2 rounded-full border-2 border-primary animate-ping opacity-75" />
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-medium">{isRecording ? "Recording Active" : "Ready to Record"}</p>
                    <p className="text-2xl font-mono font-bold text-primary">{formatTime(recordingTime)}</p>
                  </div>
                </div>

                {/* Audio Level Indicator */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Audio Level</span>
                    <span>{Math.round(audioLevel)}%</span>
                  </div>
                  <Progress value={audioLevel} className="h-2" />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">12</p>
                    <p className="text-xs text-muted-foreground">Calls Today</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">4.8</p>
                    <p className="text-xs text-muted-foreground">Avg Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coaching Suggestions Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Real-time Coaching Insights
                </CardTitle>
                <CardDescription>AI-powered suggestions to enhance your customer interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {coachingSuggestions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Start recording to receive coaching insights</p>
                    <p className="text-sm">AI will analyze your conversation and provide real-time suggestions</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {coachingSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="text-2xl">{getTypeIcon(suggestion.type)}</div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge className={getPriorityColor(suggestion.priority)}>
                              {suggestion.priority.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{suggestion.timestamp}</span>
                          </div>
                          <p className="text-sm leading-relaxed">{suggestion.message}</p>
                          <Button size="sm" variant="outline" className="text-xs bg-transparent">
                            Implement Suggestion
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {currentPage === "post-call" && <PostCallAnalysis />}
      {currentPage === "fhir" && <FHIRDataView />}
    </div>
  )
}

function PostCallAnalysis() {
  const callData = {
    duration: "12:34",
    customerSatisfaction: 4.2,
    resolutionRate: 85,
    avgResponseTime: "2.3s",
    keyTopics: ["Billing Issue", "Account Access", "Payment Method"],
    sentiment: "Neutral → Positive",
    coachingScore: 78,
  }

  return (
    <div className="space-y-6">
      {/* Call Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Call Summary - Customer #12847</CardTitle>
          <CardDescription>Completed at {new Date().toLocaleString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{callData.duration}</p>
              <p className="text-sm text-muted-foreground">Call Duration</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{callData.customerSatisfaction}/5</p>
              <p className="text-sm text-muted-foreground">Customer Rating</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{callData.resolutionRate}%</p>
              <p className="text-sm text-muted-foreground">Resolution Rate</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-primary">{callData.coachingScore}</p>
              <p className="text-sm text-muted-foreground">Coaching Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Empathy Score</span>
                <span>82%</span>
              </div>
              <Progress value={82} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Communication Clarity</span>
                <span>76%</span>
              </div>
              <Progress value={76} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Problem Resolution</span>
                <span>85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Professional Tone</span>
                <span>90%</span>
              </div>
              <Progress value={90} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Key Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">✅ Strengths</p>
              <p className="text-sm text-green-700">
                Excellent active listening and professional tone throughout the call
              </p>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800">⚠️ Areas for Improvement</p>
              <p className="text-sm text-yellow-700">Consider pausing more to allow customer processing time</p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800">💡 Next Steps</p>
              <p className="text-sm text-blue-700">Practice empathy phrases for billing-related concerns</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call Transcript Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Call Transcript (AI Generated)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm">
                <strong>Agent:</strong> Thank you for calling. How can I help you today?
              </p>
              <span className="text-xs text-muted-foreground">00:12</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm">
                <strong>Customer:</strong> I'm having trouble accessing my account and I'm really frustrated.
              </p>
              <span className="text-xs text-muted-foreground">00:18</span>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm">
                <strong>Agent:</strong> I understand your frustration, and I'm here to help resolve this for you. Let me
                look into your account right away.
              </p>
              <span className="text-xs text-muted-foreground">00:25</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FHIRDataView() {
  const fhirData = {
    resourceType: "Communication",
    id: "call-12847",
    status: "completed",
    category: [
      {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/communication-category",
            code: "instruction",
            display: "Instruction",
          },
        ],
      },
    ],
    subject: {
      reference: "Patient/customer-12847",
      display: "Customer #12847",
    },
    encounter: {
      reference: "Encounter/call-session-12847",
    },
    sent: new Date().toISOString(),
    recipient: [
      {
        reference: "Practitioner/agent-456",
        display: "Call Center Agent",
      },
    ],
    sender: {
      reference: "Patient/customer-12847",
    },
    payload: [
      {
        contentString: "Customer inquiry regarding billing and account access issues",
      },
    ],
    note: [
      {
        text: "Call resolved successfully with 4.2/5 customer satisfaction rating",
      },
    ],
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>FHIR Communication Resource</CardTitle>
          <CardDescription>Healthcare interoperability standard representation of call data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
              <code>{JSON.stringify(fhirData, null, 2)}</code>
            </pre>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>FHIR Observation - Call Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
                <code>
                  {JSON.stringify(
                    {
                      resourceType: "Observation",
                      id: "call-metrics-12847",
                      status: "final",
                      category: [
                        {
                          coding: [
                            {
                              system: "http://terminology.hl7.org/CodeSystem/observation-category",
                              code: "survey",
                              display: "Survey",
                            },
                          ],
                        },
                      ],
                      code: {
                        coding: [
                          {
                            system: "http://loinc.org",
                            code: "72133-2",
                            display: "Customer satisfaction score",
                          },
                        ],
                      },
                      subject: {
                        reference: "Patient/customer-12847",
                      },
                      valueQuantity: {
                        value: 4.2,
                        unit: "score",
                        system: "http://unitsofmeasure.org",
                        code: "1",
                      },
                      component: [
                        {
                          code: {
                            coding: [
                              {
                                system: "http://example.org/call-metrics",
                                code: "duration",
                                display: "Call Duration",
                              },
                            ],
                          },
                          valueQuantity: {
                            value: 754,
                            unit: "seconds",
                            system: "http://unitsofmeasure.org",
                            code: "s",
                          },
                        },
                      ],
                    },
                    null,
                    2,
                  )}
                </code>
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>FHIR DiagnosticReport - Coaching Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
                <code>
                  {JSON.stringify(
                    {
                      resourceType: "DiagnosticReport",
                      id: "coaching-analysis-12847",
                      status: "final",
                      category: [
                        {
                          coding: [
                            {
                              system: "http://terminology.hl7.org/CodeSystem/v2-0074",
                              code: "OTH",
                              display: "Other",
                            },
                          ],
                        },
                      ],
                      code: {
                        coding: [
                          {
                            system: "http://example.org/coaching",
                            code: "performance-analysis",
                            display: "Performance Analysis",
                          },
                        ],
                      },
                      subject: {
                        reference: "Practitioner/agent-456",
                      },
                      effectiveDateTime: new Date().toISOString(),
                      result: [
                        {
                          reference: "Observation/empathy-score-82",
                        },
                        {
                          reference: "Observation/clarity-score-76",
                        },
                        {
                          reference: "Observation/resolution-score-85",
                        },
                      ],
                      conclusion:
                        "Agent demonstrated strong professional communication with opportunities for improvement in pacing and customer processing time.",
                    },
                    null,
                    2,
                  )}
                </code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>FHIR Benefits for Call Center Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">🔄 Interoperability</h4>
              <p className="text-sm text-muted-foreground">
                Standardized format enables seamless data exchange between healthcare systems and call center platforms
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">📊 Analytics Integration</h4>
              <p className="text-sm text-muted-foreground">
                Structured data format facilitates advanced analytics and reporting across healthcare organizations
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">🔒 Compliance</h4>
              <p className="text-sm text-muted-foreground">
                FHIR standard supports HIPAA compliance and healthcare data governance requirements
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">🚀 Scalability</h4>
              <p className="text-sm text-muted-foreground">
                RESTful API design enables scalable integration with existing healthcare infrastructure
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
