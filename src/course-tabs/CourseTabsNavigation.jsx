import React, { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from '@edx/frontend-platform/i18n';
import classNames from 'classnames';
import { useDispatch } from 'react-redux';

import messages from './messages';
import Tabs from '../generic/tabs/Tabs';
import { CoursewareSearch, CoursewareSearchToggle } from '../course-home/courseware-search';
import { useCoursewareSearchState } from '../course-home/courseware-search/hooks';
import { fetchOutlineTab } from '../course-home/data';

// Slugs that benefit from prefetch on hover. Only outline is expensive enough to warrant it.
const PREFETCH_SLUGS = new Set(['outline']);

const CourseTabsNavigation = ({
  activeTabSlug, className, tabs,
}) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const { show } = useCoursewareSearchState();

  // Track which courseId+slug combos have already been prefetched to avoid duplicate dispatches.
  const prefetchedRef = useRef(new Set());

  const handleTabMouseEnter = useCallback((slug, url) => {
    if (slug === activeTabSlug) { return; }
    if (!PREFETCH_SLUGS.has(slug)) { return; }

    // Extract courseId from URL pattern /learning/course/<courseId>/...
    const match = url.match(/\/learning\/course\/([^/]+)\//);
    if (!match) { return; }
    const courseId = match[1];

    const key = `${courseId}::${slug}`;
    if (prefetchedRef.current.has(key)) { return; }
    prefetchedRef.current.add(key);

    dispatch(fetchOutlineTab(courseId));
  }, [activeTabSlug, dispatch]);

  return (
    <div id="courseTabsNavigation" className={classNames('course-tabs-navigation', className)}>
      <div className="container-xl">
        <div className="nav-bar">
          <div className="nav-menu">
            <Tabs
              className="nav-underline-tabs"
              aria-label={intl.formatMessage(messages.courseMaterial)}
            >
              {tabs.map(({ url, title, slug }) => (
                <a
                  key={slug}
                  className={classNames('nav-item flex-shrink-0 nav-link', { active: slug === activeTabSlug })}
                  href={url}
                  onMouseEnter={() => handleTabMouseEnter(slug, url)}
                >
                  {title}
                </a>
              ))}
            </Tabs>
          </div>
          <div className="search-toggle">
            <CoursewareSearchToggle />
          </div>
        </div>
      </div>
      {show && <CoursewareSearch />}
    </div>
  );
};

CourseTabsNavigation.propTypes = {
  activeTabSlug: PropTypes.string,
  className: PropTypes.string,
  tabs: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
  })).isRequired,
};

CourseTabsNavigation.defaultProps = {
  activeTabSlug: undefined,
  className: null,
};

export default CourseTabsNavigation;
