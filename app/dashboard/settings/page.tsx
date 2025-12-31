"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, Globe, Moon, Shield, User, Smartphone, Brain, Upload, FileText, Trash2, Loader2, Info, Plug, Database, Plus, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"

interface Dataset {
    id: string
    name: string
}

interface Document {
    id: string
    fileName: string
    createdAt: string
}

export default function SettingsPage() {
    const [datasets, setDatasets] = useState<Dataset[]>([])
    const [documents, setDocuments] = useState<Document[]>([])
    const [selectedDataset, setSelectedDataset] = useState<string>("")
    const [isUploading, setIsUploading] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isDocsLoading, setIsDocsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    
    // Profile form state
    const [displayName, setDisplayName] = useState("")
    const [email, setEmail] = useState("")
    const [timezone, setTimezone] = useState("")
    
    const { toast } = useToast()
    const { user, isLoading: isUserLoading, mutate } = useUser()

    useEffect(() => {
        if (user) {
            setDisplayName(user.name || "")
            setEmail(user.email || "")
            setTimezone(user.timezone || "Pacific Standard Time (PST)")
        }
    }, [user])

    useEffect(() => {
        async function fetchDatasets() {
            try {
                const res = await fetch("/api/data-sources")
                if (res.ok) {
                    const data = await res.json()
                    setDatasets(data)
                    if (data.length > 0) setSelectedDataset(data[0].id)
                }
            } catch (error) {
                console.error("Failed to fetch datasets", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchDatasets()
    }, [])

    useEffect(() => {
        if (selectedDataset) {
            fetchDocuments()
        }
    }, [selectedDataset])

    async function fetchDocuments() {
        setIsDocsLoading(true)
        try {
            const res = await fetch(`/api/analyst/context/list?datasetId=${selectedDataset}`)
            if (res.ok) {
                const data = await res.json()
                setDocuments(data)
            }
        } catch (error) {
            console.error("Failed to fetch documents", error)
        } finally {
            setIsDocsLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !selectedDataset) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("datasetId", selectedDataset)

        try {
            const res = await fetch("/api/analyst/context/upload", {
                method: "POST",
                body: formData,
            })

            if (res.ok) {
                toast({
                    title: "Success",
                    description: "Document ingested into Business Brain.",
                })
                fetchDocuments()
            } else {
                throw new Error("Upload failed")
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to upload document.",
                variant: "destructive",
            })
        } finally {
            setIsUploading(false)
        }
    }

    const handleDeleteDocument = async (fileName: string) => {
        try {
            const res = await fetch(`/api/analyst/context/delete?datasetId=${selectedDataset}&fileName=${fileName}`, {
                method: "DELETE"
            })
            if (res.ok) {
                toast({
                    title: "Deleted",
                    description: "Document removed from Business Brain.",
                })
                fetchDocuments()
            }
        } catch (error) {
            console.error("Failed to delete document", error)
        }
    }

    const handleSaveProfile = async () => {
        setIsSaving(true)
        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: displayName,
                    timezone: timezone
                })
            })

            if (res.ok) {
                toast({
                    title: "Success",
                    description: "Profile updated successfully.",
                })
                mutate() // Refresh user data
            } else {
                throw new Error("Failed to update profile")
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update profile.",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground text-sm">
                        Manage your account settings and business intelligence context.
                    </p>
                </div>
                <Separator className="my-4" />

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-xl border border-border">
                    <TabsTrigger value="general" className="gap-2">
                        <User className="h-4 w-4" /> General
                    </TabsTrigger>
                    <TabsTrigger value="brain" className="gap-2">
                        <Brain className="h-4 w-4" /> Business Brain
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" /> Notifications
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <Shield className="h-4 w-4" /> Security
                    </TabsTrigger>
                    <TabsTrigger value="connectors" className="gap-2">
                        <Plug className="h-4 w-4" /> Connectors
                    </TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-6 mt-6">
                    <Card className="rounded-2xl border-border shadow-sm">
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                                Update your photo and personal details here.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {isUserLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-6">
                                        <Avatar className="h-20 w-20 border-2 border-border">
                                            {user?.profilePicture && <AvatarImage src={user.profilePicture} />}
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                                                {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-2">
                                            <Button variant="outline" size="sm" disabled>Change Avatar</Button>
                                            <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max size of 800K</p>
                                        </div>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Display Name</Label>
                                            <Input 
                                                id="name" 
                                                value={displayName} 
                                                onChange={(e) => setDisplayName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input 
                                                id="email" 
                                                value={email} 
                                                disabled 
                                                className="bg-muted/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="role">Role</Label>
                                            <Input 
                                                id="role" 
                                                value="Administrator" 
                                                disabled 
                                                className="bg-muted/50" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="timezone">Timezone</Label>
                                            <Input 
                                                id="timezone" 
                                                value={timezone}
                                                onChange={(e) => setTimezone(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button 
                                onClick={handleSaveProfile} 
                                disabled={isSaving || isUserLoading}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="rounded-2xl border-border shadow-sm">
                        <CardHeader>
                            <CardTitle>Appearance</CardTitle>
                            <CardDescription>
                                Customize how the dashboard looks on your device.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <Moon className="h-4 w-4" />
                                        <Label className="text-base">Dark Mode</Label>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Switch between light and dark themes.
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Business Brain Settings */}
                <TabsContent value="brain" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/30 rounded-2xl">
                                <CardHeader>
                                    <CardTitle className="text-lg">Add Context</CardTitle>
                                    <CardDescription className="text-sm">Upload strategy docs, goals, and notes to give your AI context.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Target Dataset</Label>
                                            <select
                                                className="w-full bg-background border border-input h-10 px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                value={selectedDataset}
                                                onChange={(e) => setSelectedDataset(e.target.value)}
                                            >
                                                {datasets.map(d => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-primary/20 rounded-xl bg-background/50 hover:bg-background/80 transition-colors cursor-pointer relative">
                                            <Upload className="h-10 w-10 text-primary/40 mb-2" />
                                            <p className="text-sm font-medium">Click to upload</p>
                                            <p className="text-xs text-muted-foreground mt-1">PDF, TXT up to 10MB</p>
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleFileUpload}
                                                disabled={isUploading}
                                            />
                                            {isUploading && (
                                                <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-xl">
                                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-primary/5 border-primary/20 rounded-2xl">
                                <CardContent className="p-6">
                                    <div className="flex items-start gap-3">
                                        <Info className="h-5 w-5 text-primary mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-sm">One-time Setup</h4>
                                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                                Business context is usually set once. Upload your core strategy documents here to help the AI understand your business goals.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <Card className="rounded-2xl border-border shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg">Knowledge Base</CardTitle>
                                    <CardDescription>Documents currently used by the AI Analyst.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {isDocsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : documents.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {documents.map((doc) => (
                                                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-5 w-5 text-blue-500" />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium truncate">{doc.fileName}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(doc.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                                        onClick={() => handleDeleteDocument(doc.fileName)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 opacity-40">
                                            <FileText className="h-12 w-12 mx-auto mb-4" />
                                            <p className="text-lg font-medium">No documents uploaded</p>
                                            <p className="text-sm">Upload strategy docs on the left to get started.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Notification Settings */}
                <TabsContent value="notifications" className="space-y-6 mt-6">
                    <Card className="rounded-2xl border-border shadow-sm">
                        <CardHeader>
                            <CardTitle>Email Notifications</CardTitle>
                            <CardDescription>
                                Choose what you want to be notified about via email.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="marketing" className="flex flex-col space-y-1">
                                    <span>Marketing emails</span>
                                    <span className="font-normal text-muted-foreground">Receive emails about new products, features, and more.</span>
                                </Label>
                                <Switch id="marketing" />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="social" className="flex flex-col space-y-1">
                                    <span>Social notifications</span>
                                    <span className="font-normal text-muted-foreground">Receive emails when someone mentions you or shares your reports.</span>
                                </Label>
                                <Switch id="social" defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="security" className="flex flex-col space-y-1">
                                    <span>Security emails</span>
                                    <span className="font-normal text-muted-foreground">Receive emails about your account activity and security.</span>
                                </Label>
                                <Switch id="security" defaultChecked disabled />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-border shadow-sm">
                        <CardHeader>
                            <CardTitle>Push Notifications</CardTitle>
                            <CardDescription>
                                Manage push notifications for your mobile devices.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="push-reports" className="flex flex-col space-y-1">
                                    <span>Report Completions</span>
                                    <span className="font-normal text-muted-foreground">Get notified when a scheduled report is ready.</span>
                                </Label>
                                <Switch id="push-reports" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="push-alerts" className="flex flex-col space-y-1">
                                    <span>Critical Alerts</span>
                                    <span className="font-normal text-muted-foreground">Immediate notifications for anomalies and errors.</span>
                                </Label>
                                <Switch id="push-alerts" defaultChecked />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security" className="space-y-6 mt-6">
                    <Card className="rounded-2xl border-border shadow-sm">
                        <CardHeader>
                            <CardTitle>Password</CardTitle>
                            <CardDescription>
                                Change your password to keep your account secure.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current">Current Password</Label>
                                <Input id="current" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new">New Password</Label>
                                <Input id="new" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm">Confirm Password</Label>
                                <Input id="confirm" type="password" />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button>Update Password</Button>
                        </CardFooter>
                    </Card>

                    <Card className="rounded-2xl border-border shadow-sm">
                        <CardHeader>
                            <CardTitle>Two-Factor Authentication</CardTitle>
                            <CardDescription>
                                Add an extra layer of security to your account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="h-4 w-4" />
                                        <Label className="text-base">Authenticator App</Label>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Use an app like Google Authenticator to generate verification codes.
                                    </p>
                                </div>
                                <Button variant="outline">Setup</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Connectors Settings */}
                <TabsContent value="connectors" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-primary/20 bg-primary/5 rounded-2xl">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Active Connectors</CardTitle>
                                    <Button size="sm" className="rounded-xl gap-2">
                                        <Plus className="h-4 w-4" /> Add New
                                    </Button>
                                </div>
                                <CardDescription>Manage your store and data source connections.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {datasets.length > 0 ? datasets.map(dataset => (
                                    <div key={dataset.id} className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-accent rounded-xl">
                                                <Database className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{dataset.name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Connected</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 opacity-40">
                                        <Plug className="h-12 w-12 mx-auto mb-4" />
                                        <p className="text-sm font-medium">No connectors active</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-border shadow-sm">
                            <CardHeader>
                                <CardTitle>Available Integrations</CardTitle>
                                <CardDescription>Connect more tools to enrich your AI's context.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="p-4 border rounded-2xl flex flex-col items-center gap-2 opacity-50 grayscale cursor-not-allowed">
                                    <div className="h-10 w-10 bg-accent rounded-xl flex items-center justify-center font-bold">S</div>
                                    <span className="text-xs font-medium">Shopify</span>
                                </div>
                                <div className="p-4 border rounded-2xl flex flex-col items-center gap-2 opacity-50 grayscale cursor-not-allowed">
                                    <div className="h-10 w-10 bg-accent rounded-xl flex items-center justify-center font-bold">W</div>
                                    <span className="text-xs font-medium">WooCommerce</span>
                                </div>
                                <div className="p-4 border rounded-2xl flex flex-col items-center gap-2 opacity-50 grayscale cursor-not-allowed">
                                    <div className="h-10 w-10 bg-accent rounded-xl flex items-center justify-center font-bold">St</div>
                                    <span className="text-xs font-medium">Stripe</span>
                                </div>
                                <div className="p-4 border rounded-2xl flex flex-col items-center gap-2 opacity-50 grayscale cursor-not-allowed">
                                    <div className="h-10 w-10 bg-accent rounded-xl flex items-center justify-center font-bold">A</div>
                                    <span className="text-xs font-medium">Amazon</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
            </div>
        </div>
    )
}
