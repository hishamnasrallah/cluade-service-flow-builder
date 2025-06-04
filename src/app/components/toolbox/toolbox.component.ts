// src/app/components/toolbox/toolbox.component.ts - SIMPLIFIED VERSION
import { Component, EventEmitter, Output, OnInit } from '@angular/core';

interface ToolboxItem {
  type: string;
  label: string;
  icon: string;
  description: string;
  category: string;
  color?: string;
  popularity?: number;
  isNew?: boolean;
  isPro?: boolean;
}

interface ToolboxCategory {
  name: string;
  icon: string;
  color: string;
  items: ToolboxItem[];
  expanded: boolean;
}

@Component({
  selector: 'app-toolbox',
  templateUrl: './toolbox.component.html',
  styleUrls: ['./toolbox.component.scss']
})
export class ToolboxComponent implements OnInit {
  @Output() nodeDropped = new EventEmitter<any>();

  searchTerm = '';
  filteredItems: ToolboxItem[] = [];
  recentItems: ToolboxItem[] = [];

  categories: ToolboxCategory[] = [
    {
      name: 'Flow Control',
      icon: 'alt_route',
      color: '#3b82f6',
      expanded: true,
      items: [
        {
          type: 'start',
          label: 'Start',
          icon: 'play_arrow',
          description: 'Flow entry point',
          category: 'Flow Control',
          color: '#10b981',
          popularity: 9
        },
        {
          type: 'end',
          label: 'End',
          icon: 'stop',
          description: 'Flow termination',
          category: 'Flow Control',
          color: '#ef4444',
          popularity: 9
        },
        {
          type: 'decision',
          label: 'Decision',
          icon: 'help_outline',
          description: 'Yes/No branch',
          category: 'Flow Control',
          color: '#f59e0b',
          popularity: 8
        },
        {
          type: 'condition',
          label: 'Condition',
          icon: 'rule',
          description: 'Conditional logic',
          category: 'Flow Control',
          color: '#8b5cf6',
          popularity: 7
        }
      ]
    },
    {
      name: 'Form Elements',
      icon: 'dynamic_form',
      color: '#3b82f6',
      expanded: true,
      items: [
        {
          type: 'page',
          label: 'Page',
          icon: 'description',
          description: 'Form page container',
          category: 'Form Elements',
          color: '#3b82f6',
          popularity: 9
        },
        {
          type: 'field',
          label: 'Field',
          icon: 'input',
          description: 'Input field',
          category: 'Form Elements',
          color: '#06b6d4',
          popularity: 9
        },
        {
          type: 'category',
          label: 'Category',
          icon: 'category',
          description: 'Group fields',
          category: 'Form Elements',
          color: '#8b5cf6',
          popularity: 7
        }
      ]
    },
    {
      name: 'Actions',
      icon: 'settings',
      color: '#f59e0b',
      expanded: false,
      items: [
        {
          type: 'validation',
          label: 'Validation',
          icon: 'verified',
          description: 'Data validation',
          category: 'Actions',
          color: '#10b981',
          popularity: 8
        },
        {
          type: 'calculation',
          label: 'Calculate',
          icon: 'calculate',
          description: 'Math operations',
          category: 'Actions',
          color: '#f59e0b',
          popularity: 7
        },
        {
          type: 'notification',
          label: 'Notify',
          icon: 'notifications',
          description: 'Send alerts',
          category: 'Actions',
          color: '#06b6d4',
          popularity: 6
        }
      ]
    },
    {
      name: 'Integration',
      icon: 'hub',
      color: '#8b5cf6',
      expanded: false,
      items: [
        {
          type: 'api_call',
          label: 'API Call',
          icon: 'api',
          description: 'External API',
          category: 'Integration',
          color: '#8b5cf6',
          popularity: 8
        },
        {
          type: 'database',
          label: 'Database',
          icon: 'storage',
          description: 'Data operations',
          category: 'Integration',
          color: '#ef4444',
          popularity: 7
        },
        {
          type: 'service',
          label: 'Service',
          icon: 'cloud',
          description: 'External service',
          category: 'Integration',
          color: '#06b6d4',
          popularity: 6
        }
      ]
    }
  ];

  constructor() {}

  ngOnInit(): void {
    this.loadRecentItems();
  }

  filterItems(): void {
    if (!this.searchTerm.trim()) {
      this.filteredItems = [];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredItems = this.getAllItems().filter(item =>
      item.label.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term)
    );

    // Sort by popularity
    this.filteredItems.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredItems = [];
  }

  toggleCategory(category: ToolboxCategory): void {
    category.expanded = !category.expanded;
    this.saveCategoryState();
  }

  onDragStart(event: DragEvent, item: ToolboxItem): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify(item));
      event.dataTransfer.effectAllowed = 'copy';

      // Add visual feedback
      const target = event.target as HTMLElement;
      target.classList.add('dragging');

      setTimeout(() => {
        target.classList.remove('dragging');
      }, 100);
    }
  }

  addToCanvas(item: ToolboxItem): void {
    const nodeData = {
      type: item.type,
      label: item.label,
      position: { x: 400, y: 300 },
      data: {
        description: item.description,
        icon: item.icon,
        color: item.color
      }
    };

    this.nodeDropped.emit(nodeData);
    this.addToRecentItems(item);
  }

  getTotalItemsCount(): number {
    return this.getAllItems().length;
  }

  getAllItems(): ToolboxItem[] {
    return this.categories.reduce((items, category) => {
      return items.concat(category.items);
    }, [] as ToolboxItem[]);
  }

  addToRecentItems(item: ToolboxItem): void {
    // Remove if already exists
    this.recentItems = this.recentItems.filter(recent => recent.type !== item.type);

    // Add to beginning
    this.recentItems.unshift(item);

    // Keep only last 5 items
    this.recentItems = this.recentItems.slice(0, 5);

    this.saveRecentItems();
  }

  clearRecentItems(): void {
    this.recentItems = [];
    this.saveRecentItems();
  }

  refreshComponents(): void {
    console.log('Refreshing components...');
    // Add refresh logic here
  }

  openHelp(): void {
    console.log('Opening help...');
    // Add help logic here
  }

  private loadRecentItems(): void {
    try {
      const saved = localStorage.getItem('toolbox-recent-items');
      if (saved) {
        this.recentItems = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load recent items:', error);
    }
  }

  private saveRecentItems(): void {
    try {
      localStorage.setItem('toolbox-recent-items', JSON.stringify(this.recentItems));
    } catch (error) {
      console.warn('Failed to save recent items:', error);
    }
  }

  private saveCategoryState(): void {
    try {
      const state = this.categories.reduce((acc, category) => {
        acc[category.name] = category.expanded;
        return acc;
      }, {} as { [key: string]: boolean });

      localStorage.setItem('toolbox-categories-state', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save category state:', error);
    }
  }

  private loadCategoryState(): void {
    try {
      const saved = localStorage.getItem('toolbox-categories-state');
      if (saved) {
        const state = JSON.parse(saved);
        this.categories.forEach(category => {
          if (state[category.name] !== undefined) {
            category.expanded = state[category.name];
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load category state:', error);
    }
  }
}
