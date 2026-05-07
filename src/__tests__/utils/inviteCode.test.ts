import { parseInviteCode, buildInviteUrl } from '../../utils/inviteCode';

describe('parseInviteCode', () => {
  it('accepts a raw 8-character code', () => {
    expect(parseInviteCode('A1B2C3D4')).toBe('A1B2C3D4');
  });

  it('uppercases lowercase input', () => {
    expect(parseInviteCode('a1b2c3d4')).toBe('A1B2C3D4');
  });

  it('extracts the code from a tripsync deep link', () => {
    expect(parseInviteCode('tripsync://join/A1B2C3D4')).toBe('A1B2C3D4');
  });

  it('extracts the code from an https URL', () => {
    expect(parseInviteCode('https://tripsync.app/join/A1B2C3D4?ref=foo')).toBe('A1B2C3D4');
  });

  it('returns null for codes of the wrong length', () => {
    expect(parseInviteCode('A1B2C3')).toBeNull();
    expect(parseInviteCode('A1B2C3D4E')).toBeNull();
  });

  it('returns null for codes with invalid characters', () => {
    expect(parseInviteCode('A1B2-3D4')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(parseInviteCode('')).toBeNull();
  });
});

describe('buildInviteUrl', () => {
  it('builds a tripsync deep link from a code', () => {
    expect(buildInviteUrl('a1b2c3d4')).toBe('tripsync://join/A1B2C3D4');
  });
});
