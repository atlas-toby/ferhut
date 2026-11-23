export interface VideoComment {
  id: string;
  videoId?: string;
  author: string;
  text: string;
  createdAt: string;
  canDelete?: boolean;
}

export interface FetchCommentsResponse {
  comments: VideoComment[];
}

export interface PostCommentResponse {
  comment: VideoComment;
}

const COMMENTS_ENDPOINT = "/api/comments";

export async function fetchComments(videoId: string): Promise<VideoComment[]> {
  const trimmedId = videoId.trim();
  if (!trimmedId) {
    throw new Error("videoId is required to fetch comments.");
  }

  const url = `${COMMENTS_ENDPOINT}?videoId=${encodeURIComponent(trimmedId)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(
      errorBody?.error || `Failed to load comments (${response.status}).`
    );
  }

  const data = (await response.json()) as FetchCommentsResponse;
  return Array.isArray(data.comments) ? data.comments : [];
}

export async function postComment(
  videoId: string,
  text: string,
  author: string
): Promise<VideoComment> {
  const trimmedId = videoId.trim();
  const trimmedText = text.trim();
  const trimmedAuthor = author.trim();

  if (!trimmedId) {
    throw new Error("videoId is required to post a comment.");
  }

  if (!trimmedAuthor) {
    throw new Error("Yorum yapmak icin isim girmelisiniz.");
  }

  if (trimmedAuthor.length > 30) {
    throw new Error("Isim en fazla 30 karakter olabilir.");
  }

  if (!trimmedText) {
    throw new Error("Yorum metni bos olamaz.");
  }

  if (trimmedText.length > 500) {
    throw new Error("Yorum en fazla 500 karakter olabilir.");
  }

  const response = await fetch(COMMENTS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      videoId: trimmedId,
      author: trimmedAuthor,
      text: trimmedText,
    }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(
      errorBody?.error || `Failed to post comment (${response.status}).`
    );
  }

  const data = (await response.json()) as PostCommentResponse;
  if (!data.comment) {
    throw new Error("Unexpected response from comments API.");
  }

  return data.comment;
}

export async function deleteComment(
  videoId: string,
  commentId: string
): Promise<void> {
  const trimmedVideoId = videoId.trim();
  const trimmedCommentId = commentId.trim();
  if (!trimmedVideoId || !trimmedCommentId) {
    throw new Error("videoId and commentId are required.");
  }

  const url = `${COMMENTS_ENDPOINT}?videoId=${encodeURIComponent(trimmedVideoId)}&commentId=${encodeURIComponent(trimmedCommentId)}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(
      errorBody?.error || `Failed to delete comment (${response.status}).`
    );
  }
}
