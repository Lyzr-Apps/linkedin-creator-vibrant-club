'use client'

import { useState, useEffect } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Loader2, Copy, Download, RefreshCw, Check, Sparkles, TrendingUp } from 'lucide-react'

// Agent configuration
const LINKEDIN_CONTENT_AGENT_ID = '698c1395ad2d5b3089ca42c8'

// Sunset theme colors
const THEME_VARS = {
  '--background': '30 40% 98%',
  '--foreground': '20 40% 10%',
  '--card': '30 40% 96%',
  '--card-foreground': '20 40% 10%',
  '--popover': '30 40% 94%',
  '--popover-foreground': '20 40% 10%',
  '--primary': '24 95% 53%',
  '--primary-foreground': '30 40% 98%',
  '--secondary': '30 35% 92%',
  '--secondary-foreground': '20 40% 15%',
  '--accent': '12 80% 50%',
  '--accent-foreground': '30 40% 98%',
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 98%',
  '--muted': '30 30% 90%',
  '--muted-foreground': '20 25% 45%',
  '--border': '30 35% 88%',
  '--input': '30 30% 80%',
  '--ring': '24 95% 53%',
  '--radius': '0.875rem',
} as React.CSSProperties

// Tone options
const TONES = ['Professional', 'Casual', 'Inspirational', 'Thought Leadership']

// Helper function to render markdown
function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part)
}

// Extract hashtags from text
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w]+/g
  return text.match(hashtagRegex) || []
}

// Count characters excluding hashtags for LinkedIn limit
function countLinkedInCharacters(text: string): number {
  return text.length
}

export default function Home() {
  // Form state
  const [topic, setTopic] = useState('')
  const [selectedTone, setSelectedTone] = useState('Professional')
  const [context, setContext] = useState('')

  // Response state
  const [caption, setCaption] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageName, setImageName] = useState('')
  const [imageError, setImageError] = useState(false)

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // Sample data toggle
  const [useSampleData, setUseSampleData] = useState(false)

  // Sample data effect
  useEffect(() => {
    if (useSampleData) {
      setTopic('The importance of authenticity in personal branding on LinkedIn')
      setSelectedTone('Thought Leadership')
      setContext('Share insights from building a 50K+ LinkedIn following while staying true to your values')
      setCaption(`🎯 **Your personal brand isn't about perfection—it's about authenticity.**

After growing my LinkedIn following to 50K+, here's what I learned:

**The Authenticity Paradox:**
Most people think personal branding means creating a polished, perfect image. But the posts that resonated most weren't my biggest wins—they were my honest struggles and lessons learned.

**3 Keys to Authentic Branding:**
1. Share your failures, not just your successes
2. Write like you talk—ditch the corporate jargon
3. Engage genuinely, not transactionally

**The Result?**
Higher engagement, deeper connections, and opportunities that align with who I actually am.

**Your brand should attract the right people, not impress everyone.**

What's one authentic moment you could share this week?

#PersonalBranding #LinkedInTips #Authenticity #ThoughtLeadership #CareerGrowth`)
      setImageUrl('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=627&fit=crop')
      setImageName('Professional branding visual')
      setImageError(false)
    } else {
      if (!isLoading) {
        setTopic('')
        setSelectedTone('Professional')
        setContext('')
        setCaption('')
        setImageUrl('')
        setImageName('')
        setImageError(false)
        setError('')
      }
    }
  }, [useSampleData, isLoading])

  // Character count
  const characterCount = countLinkedInCharacters(caption)
  const isOverLimit = characterCount > 3000

  // Generate post handler
  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic for your LinkedIn post')
      return
    }

    setIsLoading(true)
    setError('')
    setCopySuccess(false)
    setActiveAgentId(LINKEDIN_CONTENT_AGENT_ID)
    setImageError(false)

    try {
      // Build prompt
      const prompt = `Create a LinkedIn post about: ${topic}\n\nTone: ${selectedTone}${context ? `\n\nAdditional Context: ${context}` : ''}\n\nPlease provide an engaging caption with a hook, storytelling elements, clear CTA, and relevant hashtags. Also generate a professional image that complements the post.`

      const result = await callAIAgent(prompt, LINKEDIN_CONTENT_AGENT_ID)

      if (result.success) {
        // Extract text content
        const rawText = result?.response?.result?.text ?? result?.response?.message ?? ''

        // Strip inline markdown images from caption (they render separately)
        const cleanCaption = rawText.replace(/!\[.*?\]\(.*?\)/g, '').trim()
        setCaption(cleanCaption)

        // Extract image from module_outputs
        const files = Array.isArray(result?.module_outputs?.artifact_files)
          ? result.module_outputs.artifact_files
          : []

        if (files.length > 0 && files[0]?.file_url) {
          setImageUrl(files[0].file_url)
          setImageName(files[0].name || 'Generated LinkedIn Image')
        } else {
          setImageUrl('')
          setImageName('')
        }
      } else {
        setError('Failed to generate post. Please try again.')
      }
    } catch (err) {
      setError('An error occurred while generating your post. Please try again.')
      console.error('Generation error:', err)
    } finally {
      setIsLoading(false)
      setActiveAgentId(null)
    }
  }

  // Copy caption handler
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(caption)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  // Download image handler
  const handleDownload = () => {
    if (!imageUrl) return

    const link = document.createElement('a')
    link.href = imageUrl
    link.download = imageName || 'linkedin-post-image.jpg'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Regenerate handler
  const handleRegenerate = () => {
    handleGenerate()
  }

  return (
    <div style={THEME_VARS} className="min-h-screen bg-background text-foreground">
      {/* Gradient background overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-[hsl(30_50%_97%)] via-[hsl(20_45%_95%)] to-[hsl(40_40%_96%)] -z-10" />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-sans">LinkedIn Post Generator</h1>
              <p className="text-sm text-muted-foreground">Create engaging posts with AI-powered captions and images</p>
            </div>
          </div>

          {/* Sample Data Toggle */}
          <div className="flex items-center gap-3 bg-card/50 backdrop-blur-lg px-4 py-2 rounded-xl border border-border/50 shadow-sm">
            <label htmlFor="sample-toggle" className="text-sm font-medium cursor-pointer">Sample Data</label>
            <button
              id="sample-toggle"
              onClick={() => setUseSampleData(!useSampleData)}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 ${useSampleData ? 'bg-primary' : 'bg-muted'}`}
              disabled={isLoading}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${useSampleData ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Left Column - Input Section */}
          <div className="space-y-6">
            <Card className="bg-card/70 backdrop-blur-xl border-border/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-sans">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Create Your Post
                </CardTitle>
                <CardDescription>Enter your topic and preferences to generate an engaging LinkedIn post</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Topic Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">What do you want to post about?</label>
                  <Textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="E.g., The future of AI in marketing, lessons from my startup journey, tips for remote team management..."
                    className="min-h-[120px] bg-background/50 border-border/50 resize-none focus:ring-2 focus:ring-primary/20"
                    disabled={isLoading}
                  />
                </div>

                {/* Tone Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tone</label>
                  <div className="flex flex-wrap gap-2">
                    {TONES.map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setSelectedTone(tone)}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedTone === tone
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Context Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Context (Optional)</label>
                  <Input
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Any specific angles, data points, or details to include..."
                    className="bg-background/50 border-border/50"
                    disabled={isLoading}
                  />
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading || !topic.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 h-12 font-semibold transition-all duration-200 hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Your Post...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Post
                    </>
                  )}
                </Button>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Agent Status */}
            <Card className="bg-card/50 backdrop-blur-lg border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${activeAgentId === LINKEDIN_CONTENT_AGENT_ID ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
                    <div>
                      <p className="text-sm font-medium">LinkedIn Content Agent</p>
                      <p className="text-xs text-muted-foreground">Caption + Image Generation</p>
                    </div>
                  </div>
                  <Badge variant={activeAgentId === LINKEDIN_CONTENT_AGENT_ID ? 'default' : 'secondary'} className="text-xs">
                    {activeAgentId === LINKEDIN_CONTENT_AGENT_ID ? 'Active' : 'Ready'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Preview Section */}
          <div className="space-y-6">
            <Card className="bg-card/70 backdrop-blur-xl border-border/50 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-sans">Preview</CardTitle>
                  {caption && (
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {characterCount.toLocaleString()} / 3,000
                      </span>
                    </div>
                  )}
                </div>
                <CardDescription>Your LinkedIn post will look like this</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!caption && !isLoading ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">No post yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      {useSampleData
                        ? 'Sample post will appear here after generation'
                        : 'Enter a topic and click "Generate Post" to create your LinkedIn content'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Caption Display */}
                    {caption && (
                      <div className="bg-background/50 rounded-lg p-5 border border-border/50 space-y-4">
                        <div className="prose prose-sm max-w-none">
                          {renderMarkdown(caption)}
                        </div>

                        {/* Hashtags */}
                        {extractHashtags(caption).length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-border/30">
                            {extractHashtags(caption).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs font-normal">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Image Display */}
                    {imageUrl && !imageError ? (
                      <div className="rounded-lg overflow-hidden border border-border/50 bg-muted">
                        <img
                          src={imageUrl}
                          alt={imageName || 'Generated LinkedIn image'}
                          className="w-full h-auto object-contain"
                          style={{ aspectRatio: '1200/627' }}
                          onError={() => setImageError(true)}
                        />
                      </div>
                    ) : imageUrl && imageError ? (
                      <div className="rounded-lg border border-border/50 bg-muted p-8 text-center">
                        <p className="text-sm text-muted-foreground">Image failed to load</p>
                      </div>
                    ) : null}

                    {/* Action Bar */}
                    {caption && (
                      <div className="flex flex-wrap gap-3 pt-4 border-t border-border/30">
                        <Button
                          onClick={handleCopy}
                          variant="outline"
                          className="flex-1 min-w-[140px] bg-background/50 border-border/50 hover:bg-secondary"
                        >
                          {copySuccess ? (
                            <>
                              <Check className="mr-2 h-4 w-4 text-primary" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Caption
                            </>
                          )}
                        </Button>

                        {imageUrl && (
                          <Button
                            onClick={handleDownload}
                            variant="outline"
                            className="flex-1 min-w-[140px] bg-background/50 border-border/50 hover:bg-secondary"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download Image
                          </Button>
                        )}

                        <Button
                          onClick={handleRegenerate}
                          disabled={isLoading}
                          variant="outline"
                          className="flex-1 min-w-[140px] bg-background/50 border-border/50 hover:bg-secondary"
                        >
                          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                          Regenerate
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tips Card */}
            {!caption && !isLoading && (
              <Card className="bg-card/50 backdrop-blur-lg border-border/50">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Tips for Great LinkedIn Posts
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Start with a compelling hook to grab attention</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Keep paragraphs short for mobile readability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Include a clear call-to-action at the end</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Use 3-5 relevant hashtags for discoverability</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
