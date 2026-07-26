import { Injectable, Logger } from '@nestjs/common';
import { Maintenance } from '../../maintenances/domain/entities/Maintenance';
import { Component } from '../../maintenances/domain/entities/Component';
import { Vessel } from '../../maintenances/domain/entities/Vessel';

export interface MaintenanceContext {
  vessels: Vessel[];
  components: Component[];
  maintenances: Maintenance[];
}

@Injectable()
export class AIPromptBuilder {
  private readonly logger = new Logger(AIPromptBuilder.name);

  buildContextualPrompt(question: string, context: MaintenanceContext): string {
    const { vessels, components, maintenances } = context;

    const contextData = this.formatContextData({
      vessels,
      components,
      maintenances,
    });

    return `AVAILABLE DATA CONTEXT:
${contextData}

USER QUESTION:
${question}

Please respond based on the information above. If there is no relevant data, indicate it clearly.`;
  }

  private formatContextData(context: MaintenanceContext): string {
    const { vessels, components, maintenances } = context;

    let formatted = '';

    if (vessels && vessels.length > 0) {
      formatted += '🚢 VESSELS:\n';
      vessels.forEach((vessel, idx) => {
        formatted += `  ${idx + 1}. ${vessel.name} (Registration: ${vessel.registrationNumber}, ID: ${vessel.id})\n`;
      });
      formatted += '\n';
    }

    if (components && components.length > 0) {
      formatted += '⚙️ COMPONENTS:\n';
      components.forEach((comp, idx) => {
        formatted += `  ${idx + 1}. ${comp.name} (S/N: ${comp.serialNumber})\n`;
        formatted += `     Installed: ${this.formatDate(comp.installedAt)}\n`;
      });
      formatted += '\n';
    }

    if (maintenances && maintenances.length > 0) {
      formatted += '📋 MAINTENANCE HISTORY:\n';

      const byStatus = this.groupByStatus(maintenances);

      Object.entries(byStatus).forEach(([status, items]) => {
        formatted += `  Status: ${this.translateStatus(status)} (${items.length})\n`;
        items.forEach((maint, idx) => {
          formatted += `    ${idx + 1}. Scheduled: ${this.formatDate(maint.scheduledAt)}`;
          if (maint.performedAt) {
            formatted += `, Performed: ${this.formatDate(maint.performedAt)}`;
          }
          formatted += `\n`;
          formatted += `       Description: ${maint.description}\n`;
        });
      });
      formatted += '\n';
    }

    if (!vessels?.length && !components?.length && !maintenances?.length) {
      formatted = '⚠️ No data available in the database.';
    }

    return formatted;
  }

  private groupByStatus(maintenances: Maintenance[]): Record<string, Maintenance[]> {
    return maintenances.reduce(
      (acc, maint) => {
        const status = maint.status || 'unknown';
        if (!acc[status]) {
          acc[status] = [];
        }
        acc[status].push(maint);
        return acc;
      },
      {} as Record<string, Maintenance[]>
    );
  }

  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      pending: '⏳ Pending',
      in_progress: '🔧 In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      unknown: '❓ Unknown',
    };
    return translations[status] || status;
  }

  private formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';

    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  detectIntent(question: string): string {
    const lowerQ = question.toLowerCase();

    for (const [intent, patterns] of Object.entries({
      list: [
        'list',
        'show',
        'give',
        'which',
        'see',
        'get',
        'display',
        'lista',
        'mostra',
        'dammi',
        'quale',
        'vedere',
        'ottenere',
        'visualizza',
      ],
      history: [
        'history',
        'past',
        'previous',
        'record',
        'before',
        'storico',
        'passato',
        'precedente',
        'record',
        'prima',
      ],
      filter: ['filter', 'where', 'search', 'with', 'filtra', 'dove', 'cerca', 'con'],
      count: ['how many', 'quantity', 'total', 'quanti', 'quantità', 'totale'],
      details: ['details', 'information', 'data', 'specifications', 'dettagli', 'informazioni', 'dati', 'specifiche'],
    })) {
      if ((patterns as string[]).some((p) => lowerQ.includes(p))) {
        return intent;
      }
    }

    return 'general';
  }
}
