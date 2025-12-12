import { useCallback } from "react";
import PropTypes from "prop-types";
import { Icon, IconButton } from "@openedx/paragon";
import { useIntl } from "@edx/frontend-platform/i18n";
import { useDispatch } from "react-redux";
import { Bookmark, BookmarkBorder } from "@openedx/paragon/icons";
import { removeBookmark, addBookmark } from "./data/thunks";

const BookmarkButton = ({ isBookmarked, isProcessing, unitId }) => {
    const intl = useIntl();
    const dispatch = useDispatch();
    
    const toggleBookmark = useCallback(() => {
        if (isBookmarked) {
            dispatch(removeBookmark(unitId));
        } else {
            dispatch(addBookmark(unitId));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isBookmarked, unitId]);

    const bookmarkIcon = isBookmarked ? Bookmark : BookmarkBorder;
    const ariaLabel = isBookmarked 
        ? intl.formatMessage({ id: "unit.bookmark.button.remove.bookmark", defaultMessage: "Đã đánh dấu" })
        : intl.formatMessage({ id: "unit.bookmark.button.add.bookmark", defaultMessage: "Đánh dấu trang này" });

    return (
        <IconButton
            variant="link"
            className={`px-1 text-primary-500 ${isProcessing && "disabled"}`}
            onClick={toggleBookmark}
            src={bookmarkIcon}
            iconAs={Icon}
            alt={ariaLabel}
            aria-label={ariaLabel}
            aria-busy={isProcessing}
            disabled={isProcessing}
        />
    );
};

BookmarkButton.propTypes = {
    unitId: PropTypes.string.isRequired,
    isBookmarked: PropTypes.bool,
    isProcessing: PropTypes.bool.isRequired,
};

BookmarkButton.defaultProps = {
    isBookmarked: false,
};

export default BookmarkButton;
