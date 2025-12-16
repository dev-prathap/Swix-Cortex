"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, CreditCard, Globe, Lock, Mail, Moon, Shield, User, Smartphone } from "lucide-react"

export default function SettingsPage() {
    return (
        <div className="space-y-6 pb-10">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and set e-mail preferences.
                </p>
            </div>
            <Separator className="my-6" />

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-lg">
                    <TabsTrigger value="general" className="gap-2">
                        <User className="h-4 w-4" /> General
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" /> Notifications
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <Shield className="h-4 w-4" /> Security
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="gap-2">
                        <CreditCard className="h-4 w-4" /> Billing
                    </TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                                Update your photo and personal details here.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-6">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEJbyLnkBZM03vOyrvD2E7L1FzASCEUeuhUZCTpejgXz2LUXKGliMpcy0Q_ahsGP6cdlr1bK23rogFGT3whSFwx4fVF4J-PdHG3EzpQtp5lJAmAdW03xCOsCYgj0k8oA8SRUDz1TOn4uPIM7s0Yr0p7FVP_f1F7MoKCTdHoPgA_RTO0v0IFZWGUIMdDFAJMS8QkiFuDVe70Idyd1GHK72XhCC1WTmhkOI2eyHd_ShQHuBf9Pqwv_xwvXoXD_bfSizepCc31SPSYA2h" />
                                    <AvatarFallback>JN</AvatarFallback>
                                </Avatar>
                                <div className="space-y-2">
                                    <Button variant="outline" size="sm">Change Avatar</Button>
                                    <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max size of 800K</p>
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Display Name</Label>
                                    <Input id="name" defaultValue="Jaser Name" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" defaultValue="jaser@example.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Input id="role" defaultValue="Administrator" disabled className="bg-muted" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Input id="timezone" defaultValue="Pacific Standard Time (PST)" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button>Save Changes</Button>
                        </CardFooter>
                    </Card>

                    <Card>
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

                {/* Notification Settings */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card>
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

                    <Card>
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
                <TabsContent value="security" className="space-y-6">
                    <Card>
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

                    <Card>
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

                {/* Billing Settings */}
                <TabsContent value="billing" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscription Plan</CardTitle>
                            <CardDescription>
                                You are currently on the <span className="font-semibold text-primary">Pro Plan</span>.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg border p-4 bg-muted/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold">Pro Plan</span>
                                    <span className="text-sm text-muted-foreground">$29/month</span>
                                </div>
                                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full w-3/4"></div>
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                    <span>21 days remaining</span>
                                    <span>Renews on Jan 15, 2026</span>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full">Manage Subscription</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Method</CardTitle>
                            <CardDescription>
                                Manage your payment details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 rounded-lg border p-4">
                                <div className="h-8 w-12 bg-slate-200 rounded flex items-center justify-center">
                                    <span className="font-bold text-xs text-slate-600">VISA</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Visa ending in 4242</p>
                                    <p className="text-xs text-muted-foreground">Expiry 12/2028</p>
                                </div>
                                <Button variant="ghost" size="sm">Edit</Button>
                            </div>
                            <Button variant="outline" className="w-full">Add Payment Method</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
