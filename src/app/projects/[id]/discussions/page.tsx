
'use client';

import { useParams, useRouter } from 'next/navigation';
import { mockProjects, mockDiscussions, addMockDiscussionComment } from '@/lib/mock-data';
import type { Project } from '@/types/project';
import type { DiscussionComment } from '@/types/discussion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, MessageSquare, Send, Loader2, AlertTriangle } from 'lucide-react';
import { format, parseISO, formatDistanceToNowStrict } from 'date-fns';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty.").max(1000, "Comment too long."),
});
type CommentFormValues = z.infer<typeof commentSchema>;

export default function ProjectDiscussionsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { authState } = useAuth();

  const [project, setProject] = useState<Project | undefined>(undefined);
  const [comments, setComments] = useState<DiscussionComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: '' },
  });

  useEffect(() => {
    const foundProject = mockProjects.find((p) => p.id === projectId);
    setProject(foundProject);
    if (foundProject) {
      const projectComments = mockDiscussions
        .filter(comment => comment.projectId === projectId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort newest first
      setComments(projectComments);
    }
  }, [projectId]);

  const handleAddComment = async (values: CommentFormValues) => {
    if (!project || !authState.user) return;
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 700));

    const newComment = addMockDiscussionComment(project.id, { content: values.content, author: authState.user.username }, authState.user.username);
    setComments(prevComments => [newComment, ...prevComments]); // Add to top
    form.reset();
    setIsLoading(false);
  };


  if (!project) {
    return (
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-6" />
        <h1 className="text-3xl font-semibold mb-4">Project Not Found</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          The project for these discussions does not exist or could not be loaded.
        </p>
        <Button onClick={() => router.push('/')} size="lg">
          <ChevronLeft className="mr-2 h-5 w-5" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <Button variant="outline" onClick={() => router.push(`/projects/${projectId}`)} size="sm">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Button>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            Discussions for: <span className="text-primary">{project.name}</span>
          </h1>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="text-xl">Project Conversation</CardTitle>
          <CardDescription>Share updates, ask questions, or discuss project matters.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {authState.isAuthenticated && authState.user ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddComment)} className="flex items-start gap-3">
                <Avatar className="h-10 w-10 shrink-0 mt-1 border">
                  <AvatarImage src={`https://picsum.photos/seed/${authState.user.username.replace(/\s+/g, '')}/40`} alt={authState.user.username} data-ai-hint="user avatar" />
                  <AvatarFallback>{authState.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl>
                        <Textarea
                          placeholder="Write a comment..."
                          {...field}
                          rows={3}
                          className="resize-none text-sm"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="default" className="self-start h-auto py-2.5 px-4" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  <span className="ml-2 sr-only sm:not-sr-only">{isLoading ? "Posting..." : "Post"}</span>
                </Button>
              </form>
            </Form>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Please <Button variant="link" className="p-0 h-auto" asChild><a href="/login">log in</a></Button> to participate in discussions.
            </p>
          )}

          <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
            {comments.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No comments yet. Be the first to start the discussion!</p>
            )}
            {comments.map(comment => (
              <div key={comment.id} className="flex items-start gap-3 p-4 bg-secondary/30 rounded-lg shadow-sm">
                <Avatar className="h-9 w-9 shrink-0 border">
                  <AvatarImage src={comment.authorAvatar || `https://picsum.photos/seed/${comment.author.replace(/\s+/g, '')}/40`} alt={comment.author} data-ai-hint="user avatar"/>
                  <AvatarFallback>{comment.author.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-semibold text-foreground">{comment.author}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNowStrict(parseISO(comment.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
