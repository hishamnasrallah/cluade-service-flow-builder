// src/app/components/toolbox/toolbox.component.ts - CORRECTED VERSION
import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

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
  activeFilter = '';
  filteredItems: ToolboxItem[] = [];
  recentItems: ToolboxItem[] = [];

  quickFilters = [
    { label: 'Popular', value: 'popular', icon: 'star', color: 'primary' },
    { label: 'New', value: 'new', icon: 'fiber_new', color: 'accent' },
    { label: 'Essential', value: 'essential', icon: 'verified', color: 'primary' }
  ];

  categories: ToolboxCategory[] = [
    {
      name: 'Flow Control',
      icon: 'alt_route',
      color: 'var(--primary-500)',
      expanded: true,
      items: [
        {
          type: 'start',
          label: 'Start',
          icon: 'play_arrow',
          description: 'Flow entry point',
          category: 'Flow Control',
          color: 'var(--success-500)',
          popularity: 9,
          isNew: false
        },
        {
          type: 'end',
          label: 'End',
          icon: 'stop',
          description: 'Flow termination point',
          category: 'Flow Control',
          color: 'var(--error-500)',
          popularity: 9
        },
        {
          type: 'decision',
          label: 'Decision',
          icon: 'help_outline',
          description: 'Yes/No decision branch',
          category: 'Flow Control',
          color: 'var(--warning-500)',
          popularity: 8
        },
        {
          type: 'condition',
          label: 'Condition',
          icon: 'rule',
          description: 'Conditional logic evaluation',
          category: 'Flow Control',
          color: 'var(--secondary-500)',
          popularity: 7
        },
        {
          type: 'parallel',
          label: 'Parallel',
          icon: 'call_split',
          description: 'Execute multiple paths simultaneously',
          category: 'Flow Control',
          isNew: true,
          popularity: 6
        },
        {
          type: 'loop',
          label: 'Loop',
          icon: 'loop',
          description: 'Repeat execution until condition met',
          category: 'Flow Control',
          isPro: true,
          popularity: 5
        }
      ]
    },
    {
      name: 'Form Elements',
      icon: 'dynamic_form',
      color: 'var(--primary-600)',
      expanded: true,
      items: [
        {
          type: 'page',
          label: 'Page',
          icon: 'description',
          description: 'Form page or step container',
          category: 'Form Elements',
          popularity: 9
        },
        {
          type: 'field',
          label: 'Field',
          icon: 'input',
          description: 'Individual form input field',
          category: 'Form Elements',
          popularity: 9
        },
        {
          type: 'category',
          label: 'Category',
          icon: 'category',
          description: 'Group related fields together',
          category: 'Form Elements',
          popularity: 7
        },
        {
          type: 'section',
          label: 'Section',
          icon: 'view_module',
          description: 'Visual section divider',
          category: 'Form Elements',
          isNew: true,
          popularity: 6
        },
        {
          type: 'repeater',
          label: 'Repeater',
          icon: 'repeat',
          description: 'Dynamic repeating field group',
          category: 'Form Elements',
          isPro: true,
          popularity: 5
        }
      ]
    },
    {
      name: 'Actions & Logic',
      icon: 'psychology',
      color: 'var(--secondary-500)',
      expanded: false,
      items: [
        {
          type: 'validation',
          label: 'Validation',
          icon: 'verified',
          description: 'Data validation rules',
          category: 'Actions & Logic',
          popularity: 8
        },
        {
          type: 'calculation',
          label: 'Calculate',
          icon: 'calculate',
          description: 'Mathematical calculations',
          category: 'Actions & Logic',
          popularity: 7
        },
        {
          type: 'notification',
          label: 'Notify',
          icon: 'notifications',
          description: 'Send notifications or alerts',
          category: 'Actions & Logic',
          popularity: 6
        },
        {
          type: 'assignment',
          label: 'Assign',
          icon: 'assignment',
          description: 'Assign values to variables',
          category: 'Actions & Logic',
          isNew: true,
          popularity: 5
        },
        {
          type: 'script',
          label: 'Script',
          icon: 'code',
          description: 'Custom JavaScript execution',
          category: 'Actions & Logic',
          isPro: true,
          popularity: 4
        }
      ]
    },
    {
      name: 'Integration',
      icon: 'hub',
      color: 'var(--warning-600)',
      expanded: false,
      items: [
        {
          type: 'api_call',
          label: 'API Call',
          icon: 'api',
          description: 'External API integration',
          category: 'Integration',
          popularity: 8
        },
        {
          type: 'database',
          label: 'Database',
          icon: 'storage',
          description: 'Database operations',
          category: 'Integration',
          popularity: 7
        },
        {
          type: 'service',
          label: 'Service',
          icon: 'cloud',
          description: 'External service integration',
          category: 'Integration',
          popularity: 6
        },
        {
          type: 'webhook',
          label: 'Webhook',
          icon: 'webhook',
          description: 'HTTP webhook endpoint',
          category: 'Integration',
          isNew: true,
          popularity: 5
        },
        {
          type: 'queue',
          label: 'Queue',
          icon: 'queue',
          description: 'Message queue processing',
          category: 'Integration',
          isPro: true,
          popularity: 4
        }
      ]
    },
    {
      name: 'Data Processing',
      icon: 'transform',
      color: 'var(--success-600)',
      expanded: false,
      items: [
        {
          type: 'transform',
          label: 'Transform',
          icon: 'transform',
          description: 'Data transformation operations',
          category: 'Data Processing',
          popularity: 7
        },
        {
          type: 'filter',
          label: 'Filter',
          icon: 'filter_list',
          description: 'Filter data based on criteria',
          category: 'Data Processing',
          popularity: 6
        },
        {
          type: 'aggregate',
          label: 'Aggregate',
          icon: 'functions',
          description: 'Aggregate data (sum, avg, etc.)',
          category: 'Data Processing',
          popularity: 5
        },
        {
          type: 'sort',
          label: 'Sort',
          icon: 'sort',
          description: 'Sort data collections',
          category: 'Data Processing',
          isNew: true,
          popularity: 4
        }
      ]
    }
  ];

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadRecentItems();
    this.initializeExpandedState();
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
      item.category.toLowerCase().includes(term) ||
      item.type.toLowerCase().includes(term)
    );

    // Sort by relevance (exact matches first, then popularity)
    this.filteredItems.sort((a, b) => {
      const aExact = a.label.toLowerCase() === term;
      const bExact = b.label.toLowerCase() === term;

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      return (b.popularity || 0) - (a.popularity || 0);
    });
  }

  applyQuickFilter(filterValue: string): void {
    if (this.activeFilter === filterValue) {
      this.activeFilter = '';
      return;
    }

    this.activeFilter = filterValue;
    this.searchTerm = '';

    const allItems = this.getAllItems();

    switch (filterValue) {
      case 'popular':
        this.filteredItems = allItems.filter(item => (item.popularity || 0) >= 7);
        break;
      case 'new':
        this.filteredItems = allItems.filter(item => item.isNew);
        break;
      case 'essential':
        this.filteredItems = allItems.filter(item => (item.popularity || 0) >= 8);
        break;
      default:
        this.filteredItems = [];
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.activeFilter = '';
    this.filteredItems = [];
  }

  focusFirstResult(): void {
    // Focus on first search result for keyboard navigation
    const firstResult = document.querySelector('.search-result') as HTMLElement;
    firstResult?.focus();
  }

  collapseAll(): void {
    this.categories.forEach(category => {
      category.expanded = false;
    });
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
      position: { x: 400, y: 300 }, // Default position
      data: {
        description: item.description,
        icon: item.icon,
        color: item.color
      }
    };

    this.nodeDropped.emit(nodeData);
    this.addToRecentItems(item);
  }

  showItemInfo(item: ToolboxItem): void {
    // Open item information dialog
    console.log('Show info for:', item);
  }

  getCategoryDescription(categoryName: string): string {
    const descriptions: { [key: string]: string } = {
      'Flow Control': 'Control the execution flow of your workflow',
      'Form Elements': 'Build interactive forms and user interfaces',
      'Actions & Logic': 'Add business logic and processing actions',
      'Integration': 'Connect with external systems and services',
      'Data Processing': 'Transform and manipulate data'
    };

    return descriptions[categoryName] || '';
  }

  getFeaturedItems(category: ToolboxCategory): ToolboxItem[] {
    return category.items.filter(item => (item.popularity || 0) >= 7);
  }

  getStars(popularity: number): number[] {
    const starCount = Math.min(5, Math.max(1, Math.round(popularity / 2)));
    return Array(starCount).fill(0);
  }

  getItemTooltip(item: ToolboxItem): string {
    let tooltip = `${item.label}\n${item.description}`;

    if (item.isNew) tooltip += '\n🆕 New component';
    if (item.isPro) tooltip += '\n⭐ Pro feature';
    if (item.popularity && item.popularity >= 8) tooltip += '\n🔥 Popular';

    return tooltip;
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

  private initializeExpandedState(): void {
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
      console.warn('Failed to load categories state:', error);
    }
  }

  refreshComponents(): void {
    // Refresh component list
    console.log('Refreshing components...');
  }

  openSettings(): void {
    // Open toolbox settings
    console.log('Opening settings...');
  }

  openHelp(): void {
    // Open help documentation
    console.log('Opening help...');
  }

  trackByItem(index: number, item: ToolboxItem): string {
    return item.type;
  }

  trackByCategory(index: number, category: ToolboxCategory): string {
    return category.name;
  }

  getCategoryClass(categoryName: string): string {
    return 'category-' + categoryName.toLowerCase().replace(/\s+/g, '-');
  }
}
