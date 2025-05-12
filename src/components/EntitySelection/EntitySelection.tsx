
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

// Define entity categories and their respective entities
const entityGroups = [
  {
    category: "Contacts",
    entities: [
      { id: "customers", name: "Customers", icon: "👤" },
      { id: "suppliers", name: "Suppliers", icon: "🏭" },
      { id: "employees", name: "Employees", icon: "👨‍💼" },
    ],
  },
  {
    category: "Items & Services",
    entities: [
      { id: "products", name: "Products & Services", icon: "📦" },
      { id: "chart_of_accounts", name: "Chart of Accounts", icon: "📊" },
    ],
  },
  {
    category: "Categories",
    entities: [
      { id: "departments", name: "Departments / Locations", icon: "🏢" },
      { id: "classes", name: "Classes", icon: "🏷️" },
    ],
  },
  {
    category: "Sales",
    entities: [
      { id: "invoices", name: "Invoices", icon: "📄" },
      { id: "estimates", name: "Estimates", icon: "📝" },
      { id: "credit_memos", name: "Credit Memos", icon: "💳" },
      { id: "sales_receipts", name: "Sales Receipts", icon: "🧾" },
      { id: "received_payments", name: "Received Payments", icon: "💵" },
      { id: "refund_receipts", name: "Refund Receipts", icon: "↩️" },
    ],
  },
  {
    category: "Purchases",
    entities: [
      { id: "purchase_orders", name: "Purchase Orders", icon: "📋" },
      { id: "expenses", name: "Expenses", icon: "💸" },
      { id: "bills", name: "Bills", icon: "📑" },
      { id: "vendor_credits", name: "Vendor Credits", icon: "🔄" },
      { id: "bill_payments", name: "Bill Payments", icon: "💰" },
      { id: "credit_card_credits", name: "Credit Card Credits", icon: "💳" },
      { id: "checks", name: "Checks", icon: "✅" },
    ],
  },
  {
    category: "Other Transactions",
    entities: [
      { id: "time_tracking", name: "Time Tracking", icon: "⏱️" },
      { id: "bank_deposits", name: "Bank Deposits", icon: "🏦" },
      { id: "transfers", name: "Transfers", icon: "↔️" },
      { id: "journal_entries", name: "Journal Entries", icon: "📔" },
    ],
  },
];

export type Entity = {
  id: string;
  name: string;
  icon: string;
};

interface EntitySelectionProps {
  title: string;
  description: string;
  actionText: string;
  onContinue: (selectedEntities: Entity[]) => void;
  actionColor?: string;
}

const EntitySelection = ({
  title,
  description,
  actionText,
  onContinue,
  actionColor = "bg-transyncpro-button hover:bg-transyncpro-button/90",
}: EntitySelectionProps) => {
  const [selectedEntities, setSelectedEntities] = useState<Entity[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    entityGroups.map((group) => group.category)
  );

  const handleEntityToggle = (entity: Entity) => {
    setSelectedEntities((prev) => {
      const isSelected = prev.some((e) => e.id === entity.id);
      if (isSelected) {
        return prev.filter((e) => e.id !== entity.id);
      } else {
        return [...prev, entity];
      }
    });
  };

  const handleCategoryToggle = (category: string) => {
    setExpandedCategories((prev) => {
      const isExpanded = prev.includes(category);
      if (isExpanded) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const toggleAllInCategory = (category: string, entities: Entity[]) => {
    const categoryEntityIds = entities.map((e) => e.id);
    const allSelected = entities.every((entity) =>
      selectedEntities.some((e) => e.id === entity.id)
    );

    if (allSelected) {
      // Deselect all in this category
      setSelectedEntities((prev) =>
        prev.filter((e) => !categoryEntityIds.includes(e.id))
      );
    } else {
      // Select all in this category
      const currentSelected = selectedEntities.filter(
        (e) => !categoryEntityIds.includes(e.id)
      );
      setSelectedEntities([...currentSelected, ...entities]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-gray-500 mt-1">{description}</p>
      </div>

      <div className="grid gap-6">
        {entityGroups.map((group) => {
          const isExpanded = expandedCategories.includes(group.category);
          const allSelected = group.entities.every((entity) =>
            selectedEntities.some((e) => e.id === entity.id)
          );
          const someSelected =
            !allSelected &&
            group.entities.some((entity) =>
              selectedEntities.some((e) => e.id === entity.id)
            );

          return (
            <Card key={group.category}>
              <div
                className="p-4 border-b flex items-center justify-between cursor-pointer"
                onClick={() => handleCategoryToggle(group.category)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`category-${group.category}`}
                    checked={allSelected}
                    className={someSelected ? "bg-gray-400" : ""}
                    onCheckedChange={() =>
                      toggleAllInCategory(group.category, group.entities)
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label
                    htmlFor={`category-${group.category}`}
                    className="text-lg font-medium cursor-pointer"
                  >
                    {group.category}
                  </Label>
                  <Badge variant="outline" className="ml-2">
                    {group.entities.length}
                  </Badge>
                </div>
                <div>
                  {isExpanded ? (
                    <span className="text-lg">▼</span>
                  ) : (
                    <span className="text-lg">►</span>
                  )}
                </div>
              </div>
              {isExpanded && (
                <CardContent className="pt-4 pb-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.entities.map((entity) => (
                      <div
                        key={entity.id}
                        className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50"
                      >
                        <Checkbox
                          id={entity.id}
                          checked={selectedEntities.some(
                            (e) => e.id === entity.id
                          )}
                          onCheckedChange={() => handleEntityToggle(entity)}
                        />
                        <Label
                          htmlFor={entity.id}
                          className="flex items-center cursor-pointer"
                        >
                          <span className="mr-2">{entity.icon}</span>
                          {entity.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end mt-6">
        <Button
          onClick={() => onContinue(selectedEntities)}
          className={`${actionColor} ${
            selectedEntities.length === 0 ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={selectedEntities.length === 0}
        >
          {actionText} ({selectedEntities.length})
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default EntitySelection;
