import { useT } from '../i18n';

export default function SampleDataNote() {
  const { t } = useT();
  return (
    <span className="sample-note">
      {t('sampleData')}
    </span>
  );
}
