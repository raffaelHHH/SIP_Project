import { useT } from '../i18n';

export default function SampleDataNote() {
  const { t } = useT();
  return (
    <span className="sample-note">
      <span aria-hidden="true">ℹ️</span> {t('sampleData')}
    </span>
  );
}
