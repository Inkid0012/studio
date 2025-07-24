"use client";

import { MainHeader } from "@/components/layout/main-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { LogOut, BellOff, Trash2, Palette } from "lucide-react";

export default function SettingsPage() {
    return (
        <div>
            <MainHeader title="Settings" />
            <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Display</CardTitle>
                        <CardDescription>Customize the look of the app.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="theme-toggle" className="flex items-center gap-2 text-base">
                                <Palette className="h-5 w-5 text-muted-foreground"/>
                                Theme
                            </Label>
                            <ThemeToggle />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Notifications</CardTitle>
                        <CardDescription>Manage your notification preferences.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="dnd-mode" className="flex items-center gap-2 text-base">
                                <BellOff className="h-5 w-5 text-muted-foreground"/>
                                Do Not Disturb
                            </Label>
                            <Switch id="dnd-mode" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Account</CardTitle>
                        <CardDescription>Manage your account settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-base py-6">
                                    <LogOut className="mr-2 h-5 w-5 text-accent"/>
                                    Logout
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    You can always log back in. Your data will be saved.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-primary hover:bg-primary/90">Logout</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full justify-start text-base py-6 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20">
                                    <Trash2 className="mr-2 h-5 w-5"/>
                                    Delete Account
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your
                                    account and remove your data from our servers.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
