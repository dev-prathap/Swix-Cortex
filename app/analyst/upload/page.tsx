"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function UploadPage() {
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [name, setName] = useState('')
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState('')
    const [dragActive, setDragActive] = useState(false)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0])
        }
    }

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile)
        if (!name) {
            setName(selectedFile.name.replace(/\.[^/.]+$/, ""))
        }
        setError('')
    }

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file')
            return
        }

        setUploading(true)
        setError('')

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('name', name || file.name)

            const res = await fetch('/api/analyst/upload', {
                method: 'POST',
                body: formData
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Upload failed')
            }

            const data = await res.json()
            
            // Redirect to dataset page
            router.push(`/analyst/datasets/${data.dataset.id}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Upload Data</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Upload any CSV file - we'll figure out the rest
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upload Your Dataset</CardTitle>
                    <CardDescription>
                        No configuration needed. We'll automatically understand, clean, and analyze your data.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Drag & Drop Zone */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                            dragActive
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                                : 'border-slate-300 dark:border-slate-600'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {file ? (
                            <div className="space-y-4">
                                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                                <div>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFile(null)}
                                >
                                    Choose Different File
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Upload className="h-12 w-12 text-slate-400 mx-auto" />
                                <div>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                        Drag and drop your CSV file here
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        or click to browse
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    id="file-upload"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            handleFileSelect(e.target.files[0])
                                        }
                                    }}
                                />
                                <label htmlFor="file-upload">
                                    <Button variant="outline" asChild>
                                        <span className="cursor-pointer">
                                            <FileText className="h-4 w-4 mr-2" />
                                            Browse Files
                                        </span>
                                    </Button>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Dataset Name */}
                    <div className="space-y-2">
                        <Label htmlFor="dataset-name">Dataset Name</Label>
                        <Input
                            id="dataset-name"
                            placeholder="e.g., Q4 Sales Data"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <p className="text-xs text-slate-500">
                            Give your dataset a meaningful name for easy identification
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-400">
                            <AlertCircle className="h-5 w-5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Upload Button */}
                    <Button
                        size="lg"
                        className="w-full"
                        disabled={!file || uploading}
                        onClick={handleUpload}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="h-5 w-5 mr-2" />
                                Upload and Analyze
                            </>
                        )}
                    </Button>

                    {/* Info Box */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">
                            What happens next?
                        </h4>
                        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                            <li>• AI will analyze your data structure and content</li>
                            <li>• Detect data quality issues and suggest fixes</li>
                            <li>• Generate automatic insights and visualizations</li>
                            <li>• You can ask questions in plain English</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

