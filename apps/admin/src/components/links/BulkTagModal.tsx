import React, { useState } from 'react';
import { bulkTagLinks, type BulkTagMode } from '../../api/links';
import { useLocale } from '../../contexts/LocaleContext';
import { formatApiErrorMessage } from '../../utils/apiErrorMessage';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

// Mount only while open so every open starts from the "add" mode with an empty field.
export function BulkTagModal({
  selectedIds,
  onClose,
  onCompleted,
}: {
  selectedIds: string[];
  onClose: () => void;
  onCompleted: () => Promise<void>;
}) {
  const { t } = useLocale();
  const { success, error } = useToast();
  const [tagMode, setTagMode] = useState<BulkTagMode>('add');
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);

  const apply = async () => {
    if (selectedIds.length === 0) return;

    const tags = tagInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (tagMode !== 'clear' && tags.length === 0) {
      error(t('enterTag'));
      return;
    }

    setLoading(true);
    try {
      const result = await bulkTagLinks(selectedIds, tags, tagMode);
      success(t('tagsUpdated', { count: result.success }));
      await onCompleted();
    } catch (e) {
      error(formatApiErrorMessage(e, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={t('bulkEditTags')} size="md">
      <div className="space-y-4">
        <Select
          label={t('mode')}
          value={tagMode}
          onChange={(e) => setTagMode(e.target.value as BulkTagMode)}
        >
          <option value="add">{t('addTagsMode')}</option>
          <option value="replace">{t('replaceTagsMode')}</option>
          <option value="remove">{t('removeTagsMode')}</option>
          <option value="clear">{t('clearTagsMode')}</option>
        </Select>

        <Input
          label={t('tags')}
          placeholder="vpn, card, campaign"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          disabled={tagMode === 'clear'}
          hint={
            tagMode === 'clear'
              ? t('clearTagsHint', { count: selectedIds.length })
              : t('commaTags')
          }
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button size="sm" onClick={apply} loading={loading}>
            {t('applyTags')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
