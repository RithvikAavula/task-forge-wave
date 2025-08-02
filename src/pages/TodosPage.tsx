import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TodoItem, Todo } from "@/components/todos/TodoItem";
import { AddTodoForm } from "@/components/todos/AddTodoForm";
import { TodoFilters } from "@/components/todos/TodoFilters";
import { LogOut, User, CheckSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { User as SupabaseUser } from "@supabase/supabase-js";

const TodosPage = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Load todos
    loadTodos();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          navigate('/signin');
        } else if (session?.user) {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load todos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTodo = async (title: string, description: string) => {
    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([
          {
            title,
            description: description || null,
            user_id: user?.id,
            completed: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setTodos([data, ...todos]);
      toast({
        title: "Todo added",
        description: "Your new todo has been created.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add todo",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const updateTodo = async (id: string, updates: { title?: string; description?: string; completed?: boolean }) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, ...updates } : todo
      ));

      if ('completed' in updates) {
        toast({
          title: updates.completed ? "Todo completed" : "Todo reopened",
          description: updates.completed 
            ? "Great job on completing this task!" 
            : "Task moved back to pending.",
        });
      } else {
        toast({
          title: "Todo updated",
          description: "Your changes have been saved.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update todo",
        variant: "destructive",
      });
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTodos(todos.filter(todo => todo.id !== id));
      toast({
        title: "Todo deleted",
        description: "The todo has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete todo",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/signin');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === "pending") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const counts = {
    total: todos.length,
    pending: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckSquare className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Todo App
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                {user?.email}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Add Todo Form */}
          <AddTodoForm onAdd={addTodo} isLoading={isAdding} />

          {/* Stats and Filters */}
          {todos.length > 0 && (
            <TodoFilters
              filter={filter}
              onFilterChange={setFilter}
              counts={counts}
            />
          )}

          {/* Todos List */}
          <div className="space-y-4">
            {todos.length === 0 ? (
              <Card className="p-12 text-center border-dashed border-2 border-muted-foreground/20">
                <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No todos yet
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create your first todo above to get started!
                </p>
              </Card>
            ) : filteredTodos.length === 0 ? (
              <Card className="p-8 text-center">
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No {filter} todos
                </h3>
                <p className="text-sm text-muted-foreground">
                  {filter === "pending" 
                    ? "All caught up! No pending tasks."
                    : "No completed tasks yet. Keep going!"
                  }
                </p>
              </Card>
            ) : (
              filteredTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onUpdate={updateTodo}
                  onDelete={deleteTodo}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TodosPage;