"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, Loader, Sparkles } from "lucide-react";
import { getProfileSuggestions, ProfileImprovementOutput } from "@/ai/flows/profile-improvement-tool";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/data";

const formSchema = z.object({
    profileDescription: z.string().min(20, { message: "Profile description must be at least 20 characters." }),
    desiredMatches: z.string().min(5, { message: "Please describe your desired matches." }),
});

type FormValues = z.infer<typeof formSchema>;

export function ProfileImprover() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ProfileImprovementOutput | null>(null);
    const { toast } = useToast();
    const currentUser = getCurrentUser();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            profileDescription: currentUser.bio,
            desiredMatches: "Someone funny, intelligent, and adventurous.",
        },
    });

    async function handleGetSuggestions(data: FormValues) {
        setIsLoading(true);
        setResult(null);
        try {
            const res = await getProfileSuggestions(data);
            setResult(res);
        } catch (e) {
            console.error(e);
            toast({
                variant: 'destructive',
                title: 'An error occurred',
                description: 'Failed to get suggestions from AI. Please try again.',
            });
        }
        setIsLoading(false);
    }
    
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                         <Bot className="h-8 w-8 text-accent"/>
                        <CardTitle className="font-headline text-2xl">AI Profile Coach</CardTitle>
                    </div>
                    <CardDescription>
                        Get AI-powered suggestions to make your profile stand out and attract more matches.
                    </CardDescription>
                </CardHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleGetSuggestions)}>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="profileDescription"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Your Current Profile Bio</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Tell us about yourself..."
                                                rows={5}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="desiredMatches"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Who are you looking for?</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Someone who loves outdoors, is kind, and has a good sense of humor." {...field} />
                                        </FormControl>
                                        <FormDescription>Describe the type of person you'd like to meet.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isLoading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                                {isLoading ? (
                                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="mr-2 h-4 w-4" />
                                )}
                                Get Suggestions
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>

            {isLoading && (
                 <Card>
                    <CardContent className="p-6 flex items-center justify-center">
                        <Loader className="mr-2 h-8 w-8 animate-spin text-accent"/>
                        <p className="text-muted-foreground">Our AI is thinking...</p>
                    </CardContent>
                </Card>
            )}

            {result && (
                <Card className="border-accent">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl flex items-center gap-2">
                           <Sparkles className="h-6 w-6 text-accent"/> AI Suggestions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap font-body text-base">{result.suggestions}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
