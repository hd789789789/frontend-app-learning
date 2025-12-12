import PropTypes from 'prop-types';
import { PluginSlot } from '@openedx/frontend-plugin-framework';
import { useIntl } from '@edx/frontend-platform/i18n';

import UnitIconsRow from '@src/courseware/course/sequence/UnitIconsRow';
import messages from '@src/courseware/course/sequence/messages';

const UnitTitleSlot = ({
  unitId,
  unit,
  isEnabledOutlineSidebar,
  renderUnitNavigation,
  courseId,
}) => {
  const { formatMessage } = useIntl();
  const isProcessing = unit.bookmarkedUpdateState === 'loading';

  return (
    <PluginSlot
      id="org.openedx.frontend.learning.unit_title.v1"
      idAliases={['unit_title_slot']}
      pluginProps={{
        unitId,
        unit,
        isEnabledOutlineSidebar,
        renderUnitNavigation,
        courseId,
      }}
    >
      <div className="position-relative">
        <div className="d-flex justify-content-between">
          <div className="mb-0">
            <h3 className="h3">{unit.title}</h3>
          </div>
          {isEnabledOutlineSidebar && (
            <div className="d-flex align-items-center">
              {renderUnitNavigation(true)}
            </div>
          )}
        </div>
        {courseId && (
          <UnitIconsRow
            unitId={unit.id}
            unit={unit}
            isProcessing={isProcessing}
            courseId={courseId}
          />
        )}
      </div>
      <p className="sr-only">{formatMessage(messages.headerPlaceholder)}</p>
    </PluginSlot>
  );
};

UnitTitleSlot.propTypes = {
  unitId: PropTypes.string.isRequired,
  unit: PropTypes.shape({
    id: PropTypes.string.isRequired,
    bookmarked: PropTypes.bool.isRequired,
    title: PropTypes.string.isRequired,
    bookmarkedUpdateState: PropTypes.string.isRequired,
  }).isRequired,
  isEnabledOutlineSidebar: PropTypes.bool.isRequired,
  renderUnitNavigation: PropTypes.func.isRequired,
  courseId: PropTypes.string,
};

export default UnitTitleSlot;
