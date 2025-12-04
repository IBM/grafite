import { UserComment } from '@types';
import formatTime from '@utils/formatTime';

import styles from './Comment.module.scss';

interface Props {
  comment: UserComment;
  textSize?: 'sm' | 'md';
}
const Comment = ({ comment, textSize = 'sm' }: Props) => {
  const getPostedDate = () => {
    const units = [
      { name: 'year', seconds: 31536000, short: 'y' },
      { name: 'month', seconds: 2592000, short: 'mo' },
      { name: 'week', seconds: 604800, short: 'w' },
      { name: 'day', seconds: 86400, short: 'd' },
      { name: 'hour', seconds: 3600, short: 'h' },
    ];

    const secondsElapsed = Math.floor(
      (Date.now() - new Date(comment.last_updated_time || comment.created_time).getTime()) / 1000,
    );

    for (const unit of units) {
      const difference = Math.floor(secondsElapsed / unit.seconds);
      if (difference >= 1) {
        return `${difference}${unit.short}`;
      }
    }
    return '0h';
  };

  const timeInUserZone = formatTime(new Date(comment.last_updated_time || comment.created_time));

  return (
    <div className={`${styles.comment} ${textSize === 'md' ? styles.md : ''}`}>
      <div className={styles.row}>
        <div className={styles.name} title={comment.author}>
          {comment.author}
        </div>
        <div className={styles.time} title={timeInUserZone}>
          {getPostedDate()}
        </div>
      </div>
      <div className={styles.content}>{comment.text}</div>
    </div>
  );
};
export default Comment;
