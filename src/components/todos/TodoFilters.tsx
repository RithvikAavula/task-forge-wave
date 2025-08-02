import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle, Clock, List } from "lucide-react";

interface TodoFiltersProps {
  filter: "all" | "pending" | "completed";
  onFilterChange: (filter: "all" | "pending" | "completed") => void;
  counts: {
    total: number;
    pending: number;
    completed: number;
  };
}

export const TodoFilters = ({ filter, onFilterChange, counts }: TodoFiltersProps) => {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange("all")}
          className="flex items-center gap-2"
        >
          <List className="h-4 w-4" />
          All
          <Badge variant="secondary" className="ml-1">
            {counts.total}
          </Badge>
        </Button>
        
        <Button
          variant={filter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange("pending")}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4" />
          Pending
          <Badge variant="secondary" className="ml-1">
            {counts.pending}
          </Badge>
        </Button>
        
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange("completed")}
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Completed
          <Badge variant="secondary" className="ml-1">
            {counts.completed}
          </Badge>
        </Button>
      </div>
    </Card>
  );
};