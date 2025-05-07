
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
      <div className="container mx-auto py-10 px-4 text-center"> {/* Adjusted padding */}
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" /> {/* Adjusted size */}
        <h1 className="text-2xl font-semibold mb-3">Project Not Found</h1> {/* Adjusted size */}
        <p className="text-muted-foreground mb-6 text-md"> {/* Adjusted size */}
          The project for these discussions does not exist or could not be loaded.
        </p>
        <Button onClick={() => router.push('/')} size="default" className="h-10 text-sm"> {/* Adjusted size */}
          <ChevronLeft className="mr-1.5 h-4 w-4" /> Back to Dashboard {/* Adjusted size */}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6"> {/* Reduced margin */}
        <Button variant="outline" onClick={() => router.push(`/projects/${projectId}`)} size="sm" className="h-9 text-xs"> {/* Adjusted size */}
          <ChevronLeft className="mr-1.5 h-4 w-4" /> {/* Adjusted size */}
          Back to Project
        </Button>
        <div className="flex items-center gap-2 text-center sm:text-left"> {/* Ensure centered on small screens */}
          <MessageSquare className="h-6 w-6 text-primary" /> {/* Adjusted size */}
          <h1 className="text-xl font-semibold text-foreground truncate"> {/* Adjusted size, added truncate */}
            Discussions: <span className="text-primary font-bold">{project.name}</span>
          </h1>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b px-5 py-4"> {/* Adjusted padding */}
          <CardTitle className="text-lg">Project Conversation</CardTitle> {/* Adjusted size */}
          <CardDescription className="text-xs">Share updates, ask questions, or discuss project matters.</CardDescription> {/* Adjusted size */}
        </CardHeader>
        <CardContent className="pt-5 px-5 pb-5 space-y-5"> {/* Adjusted padding and spacing */}
          {authState.isAuthenticated && authState.user ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddComment)} className="flex items-start gap-3">
                <Avatar className="h-9 w-9 shrink-0 mt-1 border"> {/* Adjusted size */}
                  <AvatarImage src={`https://picsum.photos/seed/${authState.user.username.replace(/\s+/g, '')}/40`} alt={authState.user.username} data-ai-hint="user avatar" />
                  <AvatarFallback className="text-xs">{authState.user.username.charAt(0).toUpperCase()}</AvatarFallback> {/* Adjusted size */}
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
                          rows={2} // Reduced rows
                          className="resize-none text-sm leading-snug" // Adjusted line height
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="default" className="self-start h-9 px-3 text-xs" disabled={isLoading}> {/* Adjusted size */}
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {/* Adjusted size */}
                  <span className="ml-1.5 sr-only sm:not-sr-only">{isLoading ? "Posting..." : "Post"}</span>
                </Button>
              </form>
            </Form>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-3"> {/* Adjusted padding */}
              Please <Button variant="link" className="p-0 h-auto text-sm" asChild><a href="/login">log in</a></Button> to participate in discussions.
            </p>
          )}

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2"> {/* Reduced spacing */}
            {comments.length === 0 && (
              <p className="text-center text-muted-foreground py-6 text-sm">No comments yet. Be the first to start the discussion!</p> {/* Adjusted padding/size */}
            )}
            {comments.map(comment => (
              <div key={comment.id} className="flex items-start gap-2.5 p-3 bg-secondary/30 rounded-lg shadow-xs"> {/* Adjusted padding/gap */}
                <Avatar className="h-8 w-8 shrink-0 border"> {/* Adjusted size */}
                  <AvatarImage src={comment.authorAvatar || `https://picsum.photos/seed/${comment.author.replace(/\s+/g, '')}/40`} alt={comment.author} data-ai-hint="user avatar"/>
                  <AvatarFallback className="text-[10px]">{comment.author.charAt(0).toUpperCase()}</AvatarFallback> {/* Adjusted size */}
                </Avatar>
                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-semibold text-foreground">{comment.author}</p> {/* Adjusted size */}
                    <p className="text-[10px] text-muted-foreground"> {/* Adjusted size */}
                      {formatDistanceToNowStrict(parseISO(comment.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  {/* Use pre-wrap to respect newlines in comments */}
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">{comment.content}</p> {/* Added break-words */}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
